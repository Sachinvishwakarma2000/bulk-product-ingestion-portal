import httpx

CACHE = {}


async def get_exchange_rate(base: str, quote: str) -> float:
    key = f"{base}/{quote}"
    if key in CACHE:
        return CACHE[key]

    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.rates.example/v1/{base}/{quote}")
        rate = response.json()["rate"]

    CACHE[key] = rate
    return rate


async def convert_all(orders: list[dict]) -> list[dict]:
    results = []
    for order in orders:
        rate = await get_exchange_rate(order["currency"], "USD")
        results.append({**order, "usd": round(order["amount"] * rate, 2)})
    return results


def total_usd(orders: list[dict]) -> float:
    return sum(order["usd"] for order in orders)
