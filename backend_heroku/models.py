from sqlalchemy import NUMERIC, Column, JSON, DateTime, String, Integer, func ,Float,Text,Boolean,UniqueConstraint, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import inspect
from sqlalchemy.sql import func


Base = declarative_base()


class Deal(Base):
    __tablename__ = 'deal'
    id = Column(Integer, primary_key=True)
    maker = Column(Text) # solana address
    taker = Column(Text) # solana address
    maker_lamports_offer = Column(NUMERIC)
    maker_lamports_request = Column(NUMERIC)
    maker_tokens_request = Column(JSON)
    maker_locked_tokens = Column(JSON)
    status = Column(Text)  # (new, complete, canceled)
    escrow_state_pubkey = Column(Text)
    def toDict(self):
        return { c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs }

#     pub struct EscrowAccount {
#     maker: Pubkey,                        // 32
#     taker: Option<Pubkey>,                // 32
#     maker_lamports_offer: u64,            // 8
#     maker_lamports_request: u64,          // 8
#     maker_tokens_request: Vec<TokenInfo>, // 4 (vec len https://borsh.io/) + 40 * MAX_TOKENS
#     maker_locked_tokens: Vec<TokenInfo>,  // 4 + 40 * MAX_TOKENS
# }

# class Instrument(Base):
#     __tablename__ = 'instrument'
#     id = Column(Integer, primary_key=True)
#     tick_size = Column(Float, nullable=True)
#     taker_commission = Column(Float, nullable=True)
#     settlement_period = Column(Text, nullable=True)
#     quote_currency = Column(Text, nullable=True)
#     option_type = Column(Text, nullable=True)
#     min_trade_amount = Column(Float, nullable=True)
#     maker_commission = Column(Float, nullable=True)
#     kind = Column(Text, nullable=True)
#     is_active = Column(Boolean, nullable=True)
#     instrument_name = Column(Text, nullable=True, unique=True)
#     expiration_timestamp = Column(Float, nullable=True) # date_created  = Column(DateTime,  default=func.current_timestamp())
#     creation_timestamp = Column(Float, nullable=True)
#     contract_size = Column(Float, nullable=True)
#     block_trade_commission = Column(Float, nullable=True)
#     base_currency = Column(Text, nullable=True)
#     parser = Column(Integer, nullable=True) # number of parser which took instrument
#     taken = Column(Integer, nullable=True) # taken by parser
#     active = Column(Integer, nullable=True) # instrument appeared in request of all instruments
    # __table_args__ = (UniqueConstraint('tick_size', 'taker_commission','settlement_period','quote_currency','option_type','min_trade_amount',
    #                 'maker_commission', 'kind', 'is_active', 'instrument_name', 'expiration_timestamp', 'creation_timestamp','contract_size',
    #                 'block_trade_commission','base_currency' ,name='uix_all'),)


# class Orderbook(Base):
#     __tablename__ = 'orderbook'
#     id = Column(Integer, primary_key=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     timestamp = Column(Float, nullable=True)
#     instrument_name = Column(Text, nullable=True)
#     change_id = Column(Float, nullable=True)
#     bids = Column(ARRAY(Float), nullable=True)
#     asks = Column(ARRAY(Float), nullable=True)
#     channel = Column(Text, nullable=True)
#     __table_args__ = (UniqueConstraint('timestamp', 'instrument_name','change_id','channel', name='uc_all'),)

# class Trade(Base):
#     __tablename__ = 'trade'
#     id = Column(Integer, primary_key=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     trade_seq = Column(Float, nullable=True)
#     trade_id = Column(Text, nullable=True)
#     timestamp = Column(Float, nullable=True)
#     tick_direction = Column(Integer, nullable=True)
#     price = Column(Float, nullable=True)
#     mark_price = Column(Float, nullable=True)
#     instrument_name = Column(Text, nullable=True)
#     index_price = Column(Float, nullable=True)
#     direction = Column(Text, nullable=True)
#     amount = Column(Float, nullable=True)
#     channel = Column(Text, nullable=True)
#     __table_args__ = (UniqueConstraint('trade_seq', 'trade_id','timestamp','channel','instrument_name','tick_direction', name='uc_trade_all'),)

# class Warehouse(Base):
#     __tablename__ = 'warehouse'
#     id = Column(Integer, primary_key=True)
#     data = Column(JSONB)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     after_reconect = Column(Boolean)