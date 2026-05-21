# ============================================================
# 문제 1. 오즈비(Odds Ratio) 유도
# ============================================================
print("=" * 60)
print("📐 문제 1. 오즈비 유도")
print("=" * 60)
print("""
【통계 용어 정리】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 로지스틱 회귀 (Logistic Regression)
  - 결과가 0 또는 1인 분류 문제에 사용하는 회귀 분석
  - 어떤 사건이 일어날 확률(p)을 예측함

▶ 오즈 (Odds)
  - 사건이 일어날 확률 / 일어나지 않을 확률
  - Odds = p / (1-p)
  - 예) p=0.8이면 Odds = 0.8/0.2 = 4  →  "이길 확률이 질 확률의 4배"

▶ 로그 오즈 / 로짓 (log-odds / logit)
  - 오즈에 로그를 취한 값
  - logit(p) = log(p/(1-p))  ← 로지스틱 회귀의 좌변

▶ 오즈비 (Odds Ratio)
  - 두 상황에서 오즈의 비율
  - X가 1 증가할 때 오즈가 몇 배 변하는지 측정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【모형 정의】
  log(p / (1-p)) = β₀ + β₁ × balance

  양변에 exp()를 취하면:
  p / (1-p) = exp(β₀ + β₁ × balance) = exp(β₀) × exp(β₁)^balance
""")

import sympy as sp

b0, b1 = sp.symbols('beta_0 beta_1')

print("(1) balance = 0 일 때의 오즈:")
odds_0 = sp.exp(b0 + b1 * 0)
print(f"   Odds(balance=0) = exp(β₀ + β₁×0) = exp(β₀)")
print(f"   → {odds_0}")
print()

print("(2) balance = 1 일 때의 오즈:")
odds_1 = sp.exp(b0 + b1 * 1)
print(f"   Odds(balance=1) = exp(β₀ + β₁×1) = exp(β₀) × exp(β₁)")
print(f"   → {odds_1}")
print()

print("(3) Odds Ratio (balance가 1 증가할 때):")
OR = sp.simplify(odds_1 / odds_0)
print(f"   OR = Odds(balance=1) / Odds(balance=0)")
print(f"      = [exp(β₀) × exp(β₁)] / exp(β₀)")
print(f"      = exp(β₁)")
print(f"   → {OR}")
print()
print("   ✅ 의미: balance가 1 단위 증가할 때, 채무불이행 오즈는 exp(β₁)배가 됨")
print()

print("(4) β₁ = 0.005499 일 때 오즈비 계산:")
beta1_val = 0.005499
OR_val = np.exp(beta1_val)
print(f"   OR = exp(0.005499) = {OR_val:.6f}")
print(f"   ✅ 해석: balance가 1달러 증가할 때마다,")
print(f"         채무불이행 오즈는 약 {(OR_val-1)*100:.4f}% 증가함")
print(f"   예) balance 1000달러 증가 → OR = exp(0.005499×1000) = {np.exp(beta1_val*1000):.4f}배")
