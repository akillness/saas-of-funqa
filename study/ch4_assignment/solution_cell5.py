# ============================================================
# 문제 4. Performance Metrics (threshold = 0.5)
# ============================================================
print("=" * 60)
print("📈 문제 4. Performance Metrics (threshold = 0.5)")
print("=" * 60)
print("""
【통계 용어 정리 - Confusion Matrix】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               실제 Positive  실제 Negative
예측 Positive |    TP(진양성)  |   FP(위양성)  |
예측 Negative |    FN(위음성)  |   TN(진음성)  |

  TP: 실제 불이행자를 불이행으로 올바르게 예측
  FP: 실제 정상인을 불이행으로 잘못 예측 (False Alarm)
  TN: 실제 정상인을 정상으로 올바르게 예측
  FN: 실제 불이행자를 정상으로 잘못 예측 ← 금융에서 치명적!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

# 예측 확률 계산
y_true = Default2['default_num'].values
y_prob = final_model.predict(Default2).values

# threshold = 0.5 적용
threshold = 0.5
y_pred = (y_prob >= threshold).astype(int)

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
TN, FP, FN, TP = cm.ravel()
n = len(y_true)

print(f"(1) Confusion Matrix (threshold = {threshold})")
print("-" * 45)
print(f"          예측 정상    예측 불이행")
print(f"실제 정상   TN={TN:5d}    FP={FP:5d}")
print(f"실제불이행  FN={FN:5d}    TP={TP:5d}")
print()

# 지표 계산
Accuracy    = (TP + TN) / n
Sensitivity = TP / (TP + FN)   # Recall
Specificity = TN / (TN + FP)
Precision   = TP / (TP + FP)
F1          = 2 * Precision * Sensitivity / (Precision + Sensitivity)

# Kappa
Pe = ((TP+FP)/n * (TP+FN)/n) + ((TN+FN)/n * (TN+FP)/n)
Kappa = (Accuracy - Pe) / (1 - Pe)

# McNemar
McNemar_stat = (FP - FN)**2 / (FP + FN)
McNemar_pval = stats.chi2.sf(McNemar_stat, df=1)

print("Performance Metrics 표:")
print("-" * 75)
print(f"{'Metric':<15} {'공식':<30} {'계산값':>10}  해석")
print("-" * 75)
metrics = [
    ("Accuracy",    "(TP+TN)/n",                    Accuracy,    "전체 정확도"),
    ("Sensitivity", "TP/(TP+FN)",                   Sensitivity, "실제 불이행 탐지율 (Recall)"),
    ("Specificity", "TN/(TN+FP)",                   Specificity, "실제 정상 탐지율"),
    ("Precision",   "TP/(TP+FP)",                   Precision,   "불이행 예측 중 실제 불이행 비율"),
    ("F1",          "2×Prec×Sens/(Prec+Sens)",       F1,          "Precision-Recall 조화평균"),
    ("Kappa",       "(Acc−Pe)/(1−Pe)",               Kappa,       "우연 보정 일치도"),
    ("McNemar p",   "(FP−FN)²/(FP+FN) → χ²",        McNemar_pval,"FP vs FN 비대칭 검정"),
]
for name, formula, val, interp in metrics:
    print(f"{name:<15} {formula:<30} {val:>10.4f}  {interp}")
print("-" * 75)
print()

print(f"(2) McNemar 검정 분석:")
print(f"   FP = {FP:,}  (정상을 불이행으로 잘못 예측)")
print(f"   FN = {FN:,}  (불이행을 정상으로 잘못 예측)")
print(f"   → {'FP > FN' if FP > FN else 'FN > FP'}: {'정상인을 더 많이 불이행으로 오분류' if FP > FN else '불이행자를 더 많이 정상으로 오분류'}")
print(f"   McNemar p = {McNemar_pval:.4e}  → FP와 FN 비율이 {'유의하게 비대칭' if McNemar_pval<0.05 else '대칭적'}")
print()
print(f"   ✅ 금융 데이터에서: FN이 더 치명적!")
print(f"   FN = 실제 채무불이행자를 정상으로 예측 → 대출 승인 → 손실 발생")
print(f"   FP = 정상 고객을 불이행으로 예측 → 대출 거절 → 기회비용만 발생")
print()

print(f"(3) Kappa 해석:")
print(f"   Kappa = {Kappa:.4f}")
print(f"   해석 기준: 0.6~0.8 = 상당한 일치, 0.4~0.6 = 보통 일치")
kappa_level = "상당한 일치" if Kappa >= 0.6 else "보통 일치" if Kappa >= 0.4 else "낮은 일치"
print(f"   → {kappa_level}")
print()
print(f"   Accuracy만으로 판단하면 안 되는 이유:")
print(f"   - 이 데이터의 불이행 비율 = {y_true.mean()*100:.1f}% (극심한 불균형)")
print(f"   - 아무것도 안 하고 '전부 정상'으로 예측해도 Accuracy = {(1-y_true.mean())*100:.1f}%")
print(f"   - Kappa는 우연에 의한 정확도를 제거하여 실제 모형 성능을 평가")
