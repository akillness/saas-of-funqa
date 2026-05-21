# ============================================================
# 문제 2. 변수 선택 — Deviance & AIC
# ============================================================
print("=" * 60)
print("📊 문제 2. 변수 선택 — Deviance와 AIC")
print("=" * 60)
print("""
【통계 용어 정리】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ Deviance (이탈도)
  - 모형이 데이터를 얼마나 잘 설명하지 못하는지 측정
  - 값이 작을수록 모형이 데이터에 잘 맞음
  - Null Deviance: 절편만 있는 모형
  - Residual Deviance: 변수를 추가한 후의 이탈도

▶ AIC (Akaike Information Criterion, 아카이케 정보 기준)
  - AIC = -2 × 로그우도 + 2 × 파라미터 수
  - 모형 복잡도(변수 수)에 패널티를 부과함
  - 값이 작을수록 더 좋은 모형
  - 변수가 많아도 성능이 충분히 좋아야 선택

▶ Deviance 차이 검정 (Likelihood Ratio Test)
  - 두 모형의 Residual Deviance 차이가 통계적으로 유의한지 검정
  - 검정통계량 = Deviance 차이 ~ χ²(자유도 차이)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

# Default 데이터에서 더미 변수 준비
Default2 = Default.copy()
Default2['default_num'] = (Default2['default'] == 'Yes').astype(int)
Default2['student_num'] = (Default2['student'] == 'Yes').astype(int)

# 모형 적합
model1 = smf.glm('default_num ~ balance',
                  data=Default2, family=sm.families.Binomial()).fit()
model2 = smf.glm('default_num ~ balance + income',
                  data=Default2, family=sm.families.Binomial()).fit()
model3 = smf.glm('default_num ~ balance + income + student_num',
                  data=Default2, family=sm.families.Binomial()).fit()

print("(1) 각 모형의 Residual Deviance, df, AIC")
print("-" * 55)
print(f"{'모형':<10} {'Residual Dev':>15} {'df':>6} {'AIC':>12}")
print("-" * 55)
for name, m in [("모형 1", model1), ("모형 2", model2), ("모형 3", model3)]:
    print(f"{name:<10} {m.deviance:>15.4f} {m.df_resid:>6.0f} {m.aic:>12.4f}")
print("-" * 55)
print()

print("(2) Deviance 차이 검정 (Likelihood Ratio Test)")
print("-" * 55)

def lr_test(model_small, model_large, label):
    dev_diff = model_small.deviance - model_large.deviance
    df_diff  = model_small.df_resid - model_large.df_resid
    p_value  = stats.chi2.sf(dev_diff, df_diff)
    print(f"  {label}")
    print(f"  Δ Deviance = {dev_diff:.4f}, Δdf = {df_diff}")
    print(f"  p-value = {p_value:.6f}  {'✅ 유의함 (p<0.05)' if p_value < 0.05 else '❌ 유의하지 않음'}")
    print()

lr_test(model1, model2, "모형1 vs 모형2 (income 추가 효과)")
lr_test(model2, model3, "모형2 vs 모형3 (student 추가 효과)")

print("(3) 최적 모형 선택")
print("-" * 55)
print("  AIC 기준: 모형3 AIC가 가장 낮으나 모형2와 차이 미미")
print()
print("  각 모형 오즈비:")
for name, m in [("모형 1", model1), ("모형 2", model2), ("모형 3", model3)]:
    print(f"  [{name}]")
    print(f"  {np.exp(m.params).round(4).to_string()}")
    print()
print("  ✅ 결론:")
print("  - 통계적 유의성: 모형3이 student 추가로 Deviance 개선 (p<0.05)")
print("  - 실질적 유의성: student의 오즈비 효과가 balance에 비해 작음")
print("  - 최적 모형: 모형3 선택 (but 해석 복잡도 vs 성능 개선 트레이드오프 고려)")
