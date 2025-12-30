from pathlib import Path
path = Path('i18n/locales/en-US.json')
text = path.read_text()
needle = '                         pricing:  {'
replacement = '                        bookings:  {\n                                         success_title:  Booking confirmed,\n                                         confirmation_message:  Your booking has been created. We will confirm the details with the provider shortly.\n                                     },\n                        pricing:  {'
if needle not in text:
    raise SystemExit('needle not found')
text = text.replace(needle, replacement, 1)
path.write_text(text)
