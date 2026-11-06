from pydantic import BaseModel


class PublicStatsResponse(BaseModel):
    hours_served: float
    sessions_completed: int
    volunteers: int
    elders_helped: int
    schools: int
