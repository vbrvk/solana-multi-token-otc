from models import Deal
from sqlalchemy.orm import sessionmaker
import logging
from sqlalchemy import or_, select
import json
from sqlalchemy.ext.declarative import DeclarativeMeta


class AlchemyEncoder(json.JSONEncoder):

    def default(self, obj):
        if isinstance(obj.__class__, DeclarativeMeta):
            # an SQLAlchemy class
            fields = {}
            for field in [x for x in dir(obj) if not x.startswith('_') and x != 'metadata']:
                data = obj.__getattribute__(field)
                try:
                    json.dumps(data) # this will fail on non-encodable values, like other classes
                    fields[field] = data
                except TypeError:
                    fields[field] = None
            # a json-encodable dict
            return fields

        return json.JSONEncoder.default(self, obj)


async def initialise_deal(engine, data):
    #print(type(data),data)
    try:
        row = Deal(maker=data['maker'], taker=data['taker'], maker_lamports_offer=data['maker_lamports_offer'],
                  maker_lamports_request=data['maker_lamports_request'], maker_tokens_request=data['maker_tokens_request'],
                  maker_locked_tokens=data['maker_locked_tokens'], status=data['status'], escrow_state_pubkey=data['escrow_state_pubkey']
            )
    except Exception as error:
        row_id = -1
        logging.error(f"Error when assigning data to Deal model: {error}")
        return row_id
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        session.add(row)
        session.commit()
        session.refresh(row)
        row_id = row.id
    except Exception as error:
        session.rollback()
        row_id = -1
        logging.error(f"Error insert in DB: {error}")
    finally:
        session.close()
    return row_id

async def cancel_deal(engine, escrow_state_pubkey):
    failed = False
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        #session.execute(update(Deal).where(Deal.escrow_state_pubkey == escrow_state_pubkey).values(status="canceled"))
        session.query(Deal).filter(Deal.escrow_state_pubkey == escrow_state_pubkey).update({Deal.status:"canceled"}, synchronize_session = False)
        session.commit()
    except Exception as error:
        session.rollback()
        logging.error(f"Error insert in DB: {error}")
        failed = True
    finally:
        session.close()
    return failed


async def complete_deal(engine, escrow_state_pubkey):
    failed = False
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        session.query(Deal).filter(Deal.escrow_state_pubkey == escrow_state_pubkey).update({Deal.status:"completed"}, synchronize_session = False)
        session.commit()
    except Exception as error:
        session.rollback()
        logging.error(f"Error insert in DB: {error}")
        failed = True
    finally:
        session.close()
    return failed


async def show_deal(engine, address):
    failed=False
    data_json = []
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        data = session.query(Deal).filter(or_(Deal.taker == address, Deal.maker == address)).all()#all
        for row in data:
            data_json.append(row.toDict())
    except Exception as error:
        session.rollback()
        logging.error(f"Error select from DB: {error}")
        failed = True
    finally:
        session.close()
    return data_json, failed


async def show_deal_escrow_state_pubkey(engine, escrow_state_pubkey):
    failed=False
    data_json = []
    try:
        Session = sessionmaker(bind=engine)
        session = Session()
        data = session.query(Deal).filter(Deal.escrow_state_pubkey == escrow_state_pubkey).all()#all
        for row in data:
            data_json.append(row.toDict())
    except Exception as error:
        session.rollback()
        logging.error(f"Error select from DB: {error}")
        failed = True
    finally:
        session.close()
    return data_json, failed