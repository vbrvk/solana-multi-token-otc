
import logging
from sqlalchemy import create_engine
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tools
import json
import deal

# conn = tools.get_connection(data['PATH_DB'])
app = FastAPI()

# origins = [
#     "http://localhost.tiangolo.com",
#     "https://localhost.tiangolo.com",
#     "http://localhost",
#     "http://localhost:8080",
# ]

app.add_middleware(
    CORSMiddleware,
    #allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
try:
    with open("db_config.json") as json_file:
        db_config = json.load(json_file)
        DATABASE_URL = db_config['PATH_DB']
except:
    print('Extracting path from Env variable')
    DATABASE_URL = tools.get_env_variable('DATABASE_URL')

engine = create_engine(DATABASE_URL, echo=False, pool_size=1, max_overflow=0)

@app.on_event("startup")
def startup_event():
    logging.basicConfig(filename='logger.log', level=logging.INFO)

@app.get("/")
async def root():
    return {"message": "Active"}

@app.post("/initialise_deal") # change to POST
async def initialise_deal(request: Request):
    data = await request.json()
    row_id = await deal.initialise_deal(engine, data)
    if row_id == -1:
        comment = "Error when inserted"
    else:
        comment = "Successful insert row_id"
    return {comment:row_id}

@app.post("/cancel_deal/{escrow_state_pubkey}") # change to POST
async def cancel_deal(escrow_state_pubkey: str):
    failed  = await deal.cancel_deal(engine, escrow_state_pubkey)
    if failed:
        comment = "Error when trying to cancel deal with escrow_state_pubkey:"
    else:
        comment = "Successfuly canceled deal with escrow_state_pubkey:"
    return {comment:escrow_state_pubkey}
 
@app.post("/complete_deal/{escrow_state_pubkey}") # change to POST
async def complete_deal(escrow_state_pubkey: str):
    failed  = await deal.complete_deal(engine, escrow_state_pubkey)
    if failed:
        comment = "Error when trying to complete deal with escrow_state_pubkey:"
    else:
        comment = "Successfuly completed deal with escrow_state_pubkey:"
    return {comment:escrow_state_pubkey}

@app.get("/show_deal/{address}", response_class=JSONResponse)
async def show_deal(address: str):
    """Show deals for a given address"""
    data_json, failed  = await deal.show_deal(engine, address)
    if failed:
        comment = "Error when trying to show deal for address:"
        return {comment:address}
    return data_json


@app.get("/show_deal_escrow_state_pubkey/{escrow_state_pubkey}", response_class=JSONResponse)
async def show_deal_escrow_state_pubkey(escrow_state_pubkey: str):
    """Show deals for a given address"""
    data_json, failed  = await deal.show_deal_escrow_state_pubkey(engine, escrow_state_pubkey)
    if failed:
        comment = "Error when trying to show deal for escrow_state_pubkey:"
        return {comment:escrow_state_pubkey}
    return data_json
