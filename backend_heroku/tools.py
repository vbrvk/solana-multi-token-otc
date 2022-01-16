import psycopg2
import os

def get_env_variable(name):
    try:
        return os.environ[name]
    except KeyError:
        message = "Expected environment variable '{}' not set.".format(name)
        raise Exception(message)

        
def get_connection(path_db):
    path_db = path_db.split('/')
    path_db = path_db[2:]
    database = path_db[1]
    path_db = path_db[0].split(':')
    user = path_db[0]
    password, host = path_db[1].split('@')
    # print("host:",host)
    # print("db:",database)
    # print("user:",user)
    # print("password:",password)
    conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password)
    return conn

