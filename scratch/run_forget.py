import asyncio
import os
import cognee
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("Serving Cognee Cloud...")
    try:
        await cognee.serve(
            url=os.getenv("COGNEE_SERVICE_URL"),
            api_key=os.getenv("COGNEE_API_KEY")
        )
        print("Connected. Clearing remote database (forget everything)...")
        await cognee.forget(everything=True)
        print("Success: Forgot everything successfully.")
    except Exception as e:
        print(f"Error during forget operation: {e}")
    finally:
        print("Disconnecting...")
        await cognee.disconnect()
        print("Disconnected.")

if __name__ == "__main__":
    asyncio.run(main())
