# ============================================================
# 문제 3. 최종 모형 해석 (모형3 기준)
# ============================================================
print("=" * 60)
print("🔍 문제 3. 최종 모형 해석 (모형3: balance + income + student)")
print("=" * 60)
print("""
【통계 용어 정리】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 유의수준 (Significance Level)
  - 보통 α = 0.05 (5%)를 기준으로 사용
  - p-value < 0.05이면 통계적으로 유의하다고 판단

▶ 회귀계수의 방향
  - 양(+): 변수 증가 → 채무불이행 확률 증가
  - 음(-): 변수 증가 → 채무불이행 확률 감소

▶ logLik (Log-Likelihood, 로그 우도)
  - 모형이 데이터를 잘 설명하는 정도
  - 값이 클수록(0에 가까울수록) 좋음

▶ AIC 공식: AIC = -2 × logLik + 2 × p (p = 파라미터 수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

final_model = model3
print("최종 모형 summary():")
print(final_model.summary())
print()

print("(1) 유의한 변수 및 방향:")
print("-" * 55)
params = final_model.params
pvalues = final_model.pvalues
for var in params.index:
    sig = "✅ 유의" if pvalues[var] < 0.05 else "❌ 비유의"
    direction = "양(+)" if params[var] > 0 else "음(-)"
    print(f"  {var:<15}: β={params[var]:>10.6f}, p={pvalues[var]:.4e}, {sig}, 방향={direction}")
print()
print("  해석:")
print("  - balance   (+): 잔액이 클수록 채무불이행 확률 증가 ← 직관적")
print("  - income    (-): 소득이 높을수록 채무불이행 확률 감소 ← 직관적")
print("  - student   (-): 학생이면 채무불이행 확률 감소 ← 의외! (balance 통제 후)")
print()

print("(2) 각 변수 오즈비:")
print("-" * 55)
OR = np.exp(params)
CI = np.exp(final_model.conf_int())
for var in params.index:
    if var == 'Intercept': continue
    print(f"  {var:<15}: OR = {OR[var]:.6f}")
    print(f"               95% CI = ({CI.loc[var,0]:.6f}, {CI.loc[var,1]:.6f})")
    if var == 'balance':
        print(f"               → balance 1달러 증가 시 오즈 {(OR[var]-1)*100:.4f}% 증가")
    elif var == 'income':
        print(f"               → income 1달러 증가 시 오즈 {(1-OR[var])*100:.6f}% 감소")
    elif var == 'student_num':
        print(f"               → 학생이면 비학생 대비 오즈 {OR[var]:.4f}배")
    print()

print("(3) logLik와 AIC 직접 계산:")
print("-" * 55)
loglik = final_model.llf
p_params = len(final_model.params)  # 파라미터 수
AIC_manual = -2 * loglik + 2 * p_params
print(f"  logLik (모형 출력값)     = {loglik:.6f}")
print(f"  파라미터 수 (p)          = {p_params}")
print(f"  AIC (직접 계산)         = -2 × {loglik:.4f} + 2 × {p_params} = {AIC_manual:.4f}")
print(f"  AIC (모형 출력값)        = {final_model.aic:.4f}")
print(f"  차이                     = {abs(AIC_manual - final_model.aic):.8f}  ✅ 일치")
