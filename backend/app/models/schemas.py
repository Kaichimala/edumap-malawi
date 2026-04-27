from pydantic import BaseModel, Field

class SuitabilityCriteria(BaseModel):
    district_id:       int
    level:             str   = Field("primary", description="primary, secondary, or tertiary")
    road_weight:       float = Field(0.5, ge=0, le=1)
    river_weight:      float = Field(0.5, ge=0, le=1)
    population_weight: float = Field(0.5, ge=0, le=1)
    slope_weight:      float = Field(0.5, ge=0, le=1)