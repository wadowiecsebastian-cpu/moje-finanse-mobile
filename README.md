# Moje Finanse Mobile

Statyczna aplikacja do zarzadzania finansami osobistymi w ukladzie Winien / Ma, dostosowana do telefonow.

## Uruchomienie lokalne

Mozna otworzyc `index.html` bezposrednio w przegladarce albo uruchomic prosty serwer:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Nastepnie wejdz na `http://127.0.0.1:5173/index.html`.

## Co zawiera wersja mobilna

- dolna nawigacja dla najczestszych ekranow,
- wysuwane pelne menu na telefonie,
- tabele zamieniane w karty na malych ekranach,
- bezpieczne odstepy pod paski systemowe telefonu,
- manifest i kolor motywu dla trybu standalone,
- fallback, gdy IndexedDB jest niedostepne albo startuje zbyt wolno.
