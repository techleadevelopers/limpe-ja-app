from pathlib import Path, re
p = Path('src/reviews/reviews.service.ts')
t = p.read_text(encoding='utf-8')
pattern = r'(\s*const payStatus = booking\.paymentIntent\?\.status;\s*)if \(payStatus !== "PAID"\) {\s*throw new BadRequestException\("Pagamento nao confirmado."\);\s*}\s*if \(payStatus === "REFUNDED" \|\| payStatus === "CHARGEBACK"\) {\s*throw new BadRequestException\(\s*"Pagamento reembolsado ou contestado. Avalia.+?"\s*\);\s*}\s*'
repl = r'\1if (payStatus === "REFUNDED" || payStatus === "CHARGEBACK") {\n        throw new BadRequestException(\n          "Pagamento reembolsado ou contestado. Avaliacao bloqueada.",\n        );\n      }\n      if (payStatus !== "PAID") {\n        throw new BadRequestException("Pagamento nao confirmado.");\n      }\n'
new = re.sub(pattern, repl, t, flags=re.DOTALL)
if new == t:
    raise SystemExit('pattern not replaced')
p.write_text(new, encoding='utf-8')
