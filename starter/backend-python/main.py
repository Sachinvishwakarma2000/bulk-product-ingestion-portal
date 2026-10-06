from fastapi import FastAPI, UploadFile

app = FastAPI()


# TODO: implement the bulk product import.
# Accepts a CSV upload, validates rows, persists the valid ones, and returns a
# useful outcome to the caller.
@app.post("/api/products/import")
async def import_products(file: UploadFile):
    return {"error": "not implemented"}
