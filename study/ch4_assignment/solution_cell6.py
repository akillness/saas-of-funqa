# ============================================================
# 문제 5. ROC / PR Curve와 최적 threshold
# ============================================================
print("=" * 60)
print("📉 문제 5. ROC / PR Curve와 최적 threshold")
print("=" * 60)
print("""
【통계 용어 정리】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ ROC Curve (Receiver Operating Characteristic)
  - X축: FPR = FP/(FP+TN) = 1 - Specificity
  - Y축: TPR = TP/(TP+FN) = Sensitivity (Recall)
  - threshold를 0~1로 움직이면서 그린 곡선

▶ AUC (Area Under Curve)
  - ROC 곡선 아래 면적 (0.5~1.0)
  - 0.5 = 무작위 예측, 1.0 = 완벽한 예측
  - AUC > 0.9 = 우수, 0.8~0.9 = 양호, 0.7~0.8 = 보통

▶ PR Curve (Precision-Recall Curve)
  - X축: Recall (Sensitivity)
  - Y축: Precision
  - 불균형 데이터에서 ROC보다 더 정보량이 많음

▶ Youden Index
  - J = Sensitivity + Specificity - 1
  - 이 값이 최대인 threshold = 최적 임계값
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

fig, axes = plt.subplots(1, 3, figsize=(18, 6))

# ── (1) ROC Curve ──────────────────────────────────────────
fpr, tpr, thresholds_roc = roc_curve(y_true, y_prob)
roc_auc = auc(fpr, tpr)

ax = axes[0]
ax.plot(fpr, tpr, color='steelblue', lw=2,
        label=f'ROC Curve (AUC = {roc_auc:.4f})')
ax.plot([0, 1], [0, 1], 'k--', lw=1, label='무작위 예측 (AUC=0.5)')
ax.fill_between(fpr, tpr, alpha=0.1, color='steelblue')
ax.set_xlabel('FPR (1 - Specificity)', fontsize=11)
ax.set_ylabel('TPR (Sensitivity)', fontsize=11)
ax.set_title('(1) ROC Curve', fontsize=13, fontweight='bold')
ax.legend(loc='lower right')
ax.grid(True, alpha=0.3)

print(f"(1) ROC Curve AUC = {roc_auc:.4f}")
print(f"   해석: 임의 양성과 임의 음성을 비교할 때,")
print(f"         양성이 더 높은 확률을 받을 가능성이 {roc_auc*100:.2f}%")
print()

# ── (2) PR Curve ───────────────────────────────────────────
precision_arr, recall_arr, thresholds_pr = precision_recall_curve(y_true, y_prob)
pr_auc = average_precision_score(y_true, y_prob)

ax = axes[1]
ax.plot(recall_arr, precision_arr, color='darkorange', lw=2,
        label=f'PR Curve (AUC = {pr_auc:.4f})')
baseline = y_true.mean()
ax.axhline(y=baseline, color='k', linestyle='--', lw=1,
           label=f'기준선 (불이행 비율={baseline:.3f})')
ax.fill_between(recall_arr, precision_arr, alpha=0.1, color='darkorange')
ax.set_xlabel('Recall (Sensitivity)', fontsize=11)
ax.set_ylabel('Precision', fontsize=11)
ax.set_title('(2) PR Curve', fontsize=13, fontweight='bold')
ax.legend(loc='upper right')
ax.grid(True, alpha=0.3)

print(f"(2) PR Curve AUC = {pr_auc:.4f}")
print(f"   ROC AUC({roc_auc:.4f})과 비교:")
print(f"   - ROC AUC가 높아도 PR AUC는 낮을 수 있음 (불균형 데이터 특성)")
print(f"   - 불이행 비율({baseline*100:.1f}%)이 낮아 PR Curve가 더 엄격한 기준")
print()

# ── (3) Youden Index 최적 threshold ────────────────────────
youden = tpr - fpr  # Sensitivity + Specificity - 1 = TPR - FPR
best_idx = np.argmax(youden)
best_threshold = thresholds_roc[best_idx]
best_tpr = tpr[best_idx]
best_fpr = fpr[best_idx]

axes[0].scatter(best_fpr, best_tpr, color='red', s=100, zorder=5,
                label=f'최적 threshold={best_threshold:.3f}')
axes[0].legend(loc='lower right', fontsize=9)

print(f"(3) Youden Index 최적 threshold:")
print(f"   최적 threshold = {best_threshold:.4f}")
print(f"   해당 Sensitivity = {best_tpr:.4f}")
print(f"   해당 Specificity = {1-best_fpr:.4f}")
print(f"   Youden Index = {youden[best_idx]:.4f}")
print()

# ── (4) threshold 비교 ─────────────────────────────────────
y_pred_05  = (y_prob >= 0.5).astype(int)
y_pred_opt = (y_prob >= best_threshold).astype(int)

def get_metrics(y_t, y_p):
    cm_ = confusion_matrix(y_t, y_p)
    tn_, fp_, fn_, tp_ = cm_.ravel()
    sens = tp_/(tp_+fn_)
    spec = tn_/(tn_+fp_)
    return sens, spec

sens_05,  spec_05  = get_metrics(y_true, y_pred_05)
sens_opt, spec_opt = get_metrics(y_true, y_pred_opt)

print(f"(4) threshold 비교:")
print(f"{'':>20} {'threshold=0.5':>15} {'최적 threshold':>15}")
print(f"{'threshold':>20} {0.5:>15.4f} {best_threshold:>15.4f}")
print(f"{'Sensitivity':>20} {sens_05:>15.4f} {sens_opt:>15.4f}")
print(f"{'Specificity':>20} {spec_05:>15.4f} {spec_opt:>15.4f}")
print()

# ── (5) 금융 데이터 threshold 선택 ─────────────────────────
print(f"(5) 금융 데이터(채무불이행 탐지)에서 threshold 선택:")
print(f"   → 최적 threshold ({best_threshold:.3f}) 선택 권장")
print()
print(f"   이유:")
print(f"   1) FN(불이행자를 정상으로 오분류)이 더 치명적인 손실을 초래")
print(f"   2) threshold를 낮추면 Sensitivity 증가 → FN 감소")
print(f"   3) threshold 0.5: Sensitivity={sens_05:.4f} → 불이행자 {sens_05*100:.1f}% 탐지")
print(f"   4) 최적 threshold: Sensitivity={sens_opt:.4f} → 불이행자 {sens_opt*100:.1f}% 탐지")
print(f"   5) 실무에서는 비용-편익 분석으로 threshold를 더 세밀하게 조정")

# ── Threshold 비교 시각화 ───────────────────────────────────
ax = axes[2]
labels = [f'threshold=0.5\n(Sens={sens_05:.3f}, Spec={spec_05:.3f})',
          f'최적 threshold={best_threshold:.3f}\n(Sens={sens_opt:.3f}, Spec={spec_opt:.3f})']
x = np.arange(2)
width = 0.35
ax.bar(x - width/2, [sens_05, sens_opt], width, label='Sensitivity', color='steelblue', alpha=0.8)
ax.bar(x + width/2, [spec_05, spec_opt], width, label='Specificity', color='darkorange', alpha=0.8)
ax.set_xticks(x)
ax.set_xticklabels([f'threshold=0.5', f'최적({best_threshold:.3f})'], fontsize=10)
ax.set_ylim(0, 1.1)
ax.set_ylabel('값', fontsize=11)
ax.set_title('(4) Threshold 비교', fontsize=13, fontweight='bold')
ax.legend()
ax.grid(True, alpha=0.3, axis='y')
for i, (s, sp) in enumerate([(sens_05, spec_05), (sens_opt, spec_opt)]):
    ax.text(i - width/2, s + 0.02, f'{s:.3f}', ha='center', fontsize=9)
    ax.text(i + width/2, sp + 0.02, f'{sp:.3f}', ha='center', fontsize=9)

plt.suptitle('문제 5: ROC / PR Curve 및 최적 Threshold 분석',
             fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('problem5_curves.png', dpi=150, bbox_inches='tight')
plt.show()
print("\n✅ 그래프 저장 완료: problem5_curves.png")
