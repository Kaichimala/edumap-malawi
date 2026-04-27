import math
import logging
import numpy as np
import rasterio
from rasterio.windows import Window
from shapely.geometry import Point
from app.core.config import DEM_PATH, TO_WGS

logger = logging.getLogger("edumap")


def reclassify(value, vmin, vmax, invert=False):
    if vmax == vmin:
        return 5.0
    norm = (value - vmin) / (vmax - vmin)
    norm = max(0.0, min(1.0, norm))
    if invert:
        norm = 1.0 - norm
    return 1.0 + norm * 9.0


def generate_candidates(poly, n=400):
    minx, miny, maxx, maxy = poly.bounds
    side = int(math.sqrt(n))
    dx = (maxx - minx) / side
    dy = (maxy - miny) / side
    pts = []
    for r in range(side):
        for c in range(side):
            x = minx + c * dx + dx / 2
            y = miny + r * dy + dy / 2
            pt = Point(x, y)
            if poly.contains(pt):
                pts.append(pt)
    return pts


def get_slope_at_point(x_utm, y_utm, dem_src=None):
    try:
        lng, lat = TO_WGS(x_utm, y_utm)
        need_close = False
        src = dem_src
        if src is None:
            src = rasterio.open(DEM_PATH)
            need_close = True
        try:
            row, col = src.index(lng, lat)
            win = rasterio.windows.Window(max(0, col - 1), max(0, row - 1), 3, 3)
            data = src.read(1, window=win).astype(float)
            nodata = src.nodata
            if data.shape != (3, 3) or (nodata is not None and np.all(data == nodata)):
                return 0.0
            # Use metres-per-pixel correctly regardless of CRS
            if src.crs and src.crs.is_projected:
                cell_m = src.res[0]          # already in metres
            else:
                cell_m = src.res[0] * 111320  # degrees → metres approx
            gy, gx = np.gradient(data, cell_m)
            slope = np.degrees(np.arctan(np.sqrt(gx ** 2 + gy ** 2)))
            return float(slope[1, 1])
        finally:
            if need_close:
                src.close()
    except Exception as exc:
        logger.warning("Slope failed at (%.1f, %.1f): %s", x_utm, y_utm, exc)
        return 0.0

def get_slopes_for_points(pts_utm, dem_path=DEM_PATH):
    """
    Batched slope calculation for a list of UTM points.
    Reads the bounding box of the points from the DEM once, computes the gradient 
    across the numpy array, and samples the slopes. This turns 400 I/O reads into 1.
    """
    if not pts_utm:
        return []
    
    slopes = [0.0] * len(pts_utm)
    try:
        wgs_coords = [TO_WGS(pt.x, pt.y) for pt in pts_utm]
        lngs = [c[0] for c in wgs_coords]
        lats = [c[1] for c in wgs_coords]
        
        min_lng, max_lng = min(lngs), max(lngs)
        min_lat, max_lat = min(lats), max(lats)
        
        with rasterio.open(dem_path) as src:
            # Find bounds in raster coordinates
            row_start, col_start = src.index(min_lng, max_lat) # top-left
            row_end, col_end = src.index(max_lng, min_lat)     # bottom-right
            
            # Expand window slightly (2 pixels on all sides) for gradient calc context
            row_start = max(0, row_start - 2)
            col_start = max(0, col_start - 2)
            row_end = min(src.height - 1, row_end + 2)
            col_end = min(src.width - 1, col_end + 2)
            
            win_height = row_end - row_start + 1
            win_width = col_end - col_start + 1
            win = Window(col_off=col_start, row_off=row_start, width=win_width, height=win_height)
            
            data = src.read(1, window=win).astype(float)
            nodata = src.nodata
            if nodata is not None:
                data[data == nodata] = np.nan
            
            if data.shape[0] < 3 or data.shape[1] < 3:
                return slopes # Fallback to 0.0 if window is too small somehow
                
            cell_m = src.res[0] if (src.crs and src.crs.is_projected) else src.res[0] * 111320
            
            # Calculate gradient over the entire array at once
            gy, gx = np.gradient(data, cell_m)
            slope_array = np.degrees(np.arctan(np.sqrt(gx**2 + gy**2)))
            
            for i, (lng, lat) in enumerate(wgs_coords):
                r, c = src.index(lng, lat)
                r_rel = r - row_start
                c_rel = c - col_start
                
                if 0 <= r_rel < slope_array.shape[0] and 0 <= c_rel < slope_array.shape[1]:
                    s = slope_array[r_rel, c_rel]
                    if not np.isnan(s):
                        slopes[i] = float(s)
                        
    except Exception as exc:
        logger.warning(f"Batched slope calc failed: {exc}")
        # Return the 0.0 array fallback
        
    return slopes