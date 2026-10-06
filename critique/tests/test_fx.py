import pytest

from app.pricing import fx


class FakeResponse:
    def __init__(self, rate):
        self._rate = rate

    def json(self):
        return {"rate": self._rate}


class FakeClient:
    """Stands in for httpx.AsyncClient used as an async context manager."""

    def __init__(self, rate):
        self._rate = rate

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, _url):
        return FakeResponse(self._rate)


@pytest.fixture(autouse=True)
def clear_cache():
    fx.CACHE.clear()
    yield
    fx.CACHE.clear()


@pytest.fixture
def mock_rate(monkeypatch):
    def _set(rate):
        monkeypatch.setattr(fx.httpx, "AsyncClient", lambda *a, **k: FakeClient(rate))

    return _set


@pytest.mark.asyncio
async def test_get_exchange_rate(mock_rate):
    mock_rate(1.1)
    assert await fx.get_exchange_rate("EUR", "USD") == 1.1


@pytest.mark.asyncio
async def test_get_exchange_rate_is_cached(mock_rate):
    mock_rate(1.1)
    assert await fx.get_exchange_rate("EUR", "USD") == 1.1
    # A later call returns the cached value even if the upstream rate has moved.
    mock_rate(2.0)
    assert await fx.get_exchange_rate("EUR", "USD") == 1.1


@pytest.mark.asyncio
async def test_convert_all(mock_rate):
    mock_rate(1.1)
    orders = [{"currency": "EUR", "amount": 100}]
    result = await fx.convert_all(orders)
    assert result[0]["usd"] == 110.0


def test_total_usd():
    orders = [{"usd": 10.0}, {"usd": 20.5}]
    assert fx.total_usd(orders) == 30.5
