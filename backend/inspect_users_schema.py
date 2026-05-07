from sqlalchemy import create_engine, inspect
from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
inspector = inspect(engine)
print('tables=', inspector.get_table_names())
if 'users' in inspector.get_table_names():
    cols = inspector.get_columns('users')
    for c in cols:
        print(c['name'], c['type'], c['nullable'], c.get('default'))
