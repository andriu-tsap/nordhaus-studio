from main import Lead, summarize

def test_empty():
    assert summarize([])["conversion"] == 0

def test_integer_money_and_conversion():
    result = summarize([Lead(stage="Nowy", value=123), Lead(stage="Umowa", value=987)])
    assert result["pipeline"] == 1110
    assert result["won"] == 987
    assert result["conversion"] == 50
    assert result["stages"]["Umowa"] == 1
