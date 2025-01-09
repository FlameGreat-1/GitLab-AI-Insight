import pandas as pd
from marshmallow import Schema, fields, ValidationError

class TimeSeriesDataSchema(Schema):
    date = fields.DateTime(required=True)
    target = fields.Float(required=True)

def validate_data(df):
    schema = TimeSeriesDataSchema()
    errors = []
    for index, row in df.iterrows():
        try:
            schema.load(row.to_dict())
        except ValidationError as err:
            errors.append(f"Row {index}: {err.messages}")
    
    if errors:
        raise ValidationError("\n".join(errors))

    return True
