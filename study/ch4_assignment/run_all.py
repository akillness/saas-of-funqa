"""
4장 과제 전체 실행 스크립트
실행: python run_all.py
결과: output/ 폴더에 이미지 저장
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))

import numpy as np
import pandas as pd
import matplotlib
import matplotlib.font_manager as fm
matplotlib.use('Agg')
# Register Korean font directly
_korean_font = '/Users/jangyoung/Library/Fonts/NanumBarunGothic.otf'
fm.fontManager.addfont(_korean_font)
_fp = fm.FontProperties(fname=_korean_font)
matplotlib.rcParams['font.family'] = _fp.get_name()
matplotlib.rcParams['axes.unicode_minus'] = False
import matplotlib.pyplot as plt
import statsmodels.api as sm
import statsmodels.formula.api as smf
from sklearn.metrics import (
    confusion_matrix, roc_curve, auc,
    precision_recall_curve, average_precision_score
)
from scipy import stats
import sympy as sp
from ISLP import load_data

out = pathlib.Path(__file__).parent / "output"
out.mkdir(exist_ok=True)

# ── 데이터 로드 ──────────────────────────────────────────────
Default = load_data('Default')
Default2 = Default.copy()
Default2['default_num'] = (Default2['default'] == 'Yes').astype(int)
Default2['student_num'] = (Default2['student'] == 'Yes').astype(int)

print("✅ 데이터 로드 완료:", Default.shape)

# ── 문제 1. 오즈비 유도 ─────────────────────────────────────
b0, b1 = sp.symbols('beta_0 beta_1')
beta1_val = 0.005499
OR_val = np.exp(beta1_val)
print(f"\n[문제1] OR(β₁=0.005499) = {OR_val:.6f}")
print(f"  balance 1달러 증가 → 오즈 {(OR_val-1)*100:.4f}% 증가")
print(f"  balance 1000달러 증가 → OR = {np.exp(beta1_val*1000):.4f}배")

# ── 문제 2. 변수 선택 ────────────────────────────────────────
model1 = smf.glm('default_num ~ balance',
                  data=Default2, family=sm.families.Binomial()).fit()
model2 = smf.glm('default_num ~ balance + income',
                  data=Default2, family=sm.families.Binomial()).fit()
model3 = smf.glm('default_num ~ balance + income + student_num',
                  data=Default2, family=sm.families.Binomial()).fit()

print("\n[문제2] 모형 비교:")
print(f"{'모형':8} {'Deviance':12} {'df':6} {'AIC':10}")
for nm, m in [("모형1", model1), ("모형2", model2), ("모형3", model3)]:
    print(f"{nm:8} {m.deviance:12.4f} {m.df_resid:6.0f} {m.aic:10.4f}")

def lr_test(small, large):
    diff = small.deviance - large.deviance
    df   = small.df_resid  - large.df_resid
    return diff, df, stats.chi2.sf(diff, df)

d12, df12, p12 = lr_test(model1, model2)
d23, df23, p23 = lr_test(model2, model3)
print(f"\n  모형1 vs 2: ΔDeviance={d12:.4f}, p={p12:.2e}")
print(f"  모형2 vs 3: ΔDeviance={d23:.4f}, p={p23:.2e}")

# ── 문제 3. 최종 모형 해석 ───────────────────────────────────
final_model = model3
params  = final_model.params
pvalues = final_model.pvalues
OR_all  = np.exp(params)
CI      = np.exp(final_model.conf_int())
loglik  = final_model.llf
p_count = len(params)
AIC_manual = -2 * loglik + 2 * p_count

print(f"\n[문제3] logLik={loglik:.6f}, 파라미터수={p_count}")
print(f"  AIC(직접계산)={AIC_manual:.4f}, AIC(모형)={final_model.aic:.4f}")
print(f"  차이={abs(AIC_manual-final_model.aic):.8f}")

# ── 문제 4. Performance Metrics ──────────────────────────────
y_true = Default2['default_num'].values
y_prob = final_model.predict(Default2).values
y_pred = (y_prob >= 0.5).astype(int)
cm_    = confusion_matrix(y_true, y_pred)
TN, FP, FN, TP = cm_.ravel()
n = len(y_true)

Accuracy    = (TP+TN)/n
Sensitivity = TP/(TP+FN)
Specificity = TN/(TN+FP)
Precision   = TP/(TP+FP)
F1          = 2*Precision*Sensitivity/(Precision+Sensitivity)
Pe          = ((TP+FP)/n*(TP+FN)/n) + ((TN+FN)/n*(TN+FP)/n)
Kappa       = (Accuracy-Pe)/(1-Pe)
McNemar_p   = stats.chi2.sf((FP-FN)**2/(FP+FN), 1)

print(f"\n[문제4] Confusion Matrix: TP={TP}, FP={FP}, FN={FN}, TN={TN}")
print(f"  Accuracy={Accuracy:.4f}, Sensitivity={Sensitivity:.4f}")
print(f"  Specificity={Specificity:.4f}, Precision={Precision:.4f}")
print(f"  F1={F1:.4f}, Kappa={Kappa:.4f}, McNemar_p={McNemar_p:.4e}")

# ── Confusion Matrix 시각화 ──────────────────────────────────
fig, ax = plt.subplots(figsize=(5, 4))
im = ax.imshow([[TN, FP],[FN, TP]], cmap='Blues', vmin=0)
ax.set_xticks([0,1]); ax.set_yticks([0,1])
ax.set_xticklabels(['예측 정상','예측 불이행'], fontsize=11)
ax.set_yticklabels(['실제 정상','실제 불이행'], fontsize=11)
for (i,j), v in [((0,0),TN),((0,1),FP),((1,0),FN),((1,1),TP)]:
    lbl = ['TN','FP','FN','TP'][i*2+j]
    ax.text(j, i, f'{lbl}\n{v:,}', ha='center', va='center',
            fontsize=12, fontweight='bold',
            color='white' if v > cm_.max()*0.5 else 'black')
ax.set_title('Confusion Matrix (threshold=0.5)', fontsize=13, fontweight='bold')
plt.colorbar(im, ax=ax)
plt.tight_layout()
plt.savefig(out/'fig_confusion_matrix.png', dpi=150)
plt.close()
print(f"\n  ✅ Confusion Matrix 저장")

# ── 문제 5. ROC / PR Curve ───────────────────────────────────
fpr, tpr, thr_roc = roc_curve(y_true, y_prob)
roc_auc = auc(fpr, tpr)
prec_arr, rec_arr, _ = precision_recall_curve(y_true, y_prob)
pr_auc = average_precision_score(y_true, y_prob)

youden  = tpr - fpr
best_i  = np.argmax(youden)
best_thr = thr_roc[best_i]

y_pred_opt = (y_prob >= best_thr).astype(int)
cm_opt = confusion_matrix(y_true, y_pred_opt)
TN_o, FP_o, FN_o, TP_o = cm_opt.ravel()
sens_opt = TP_o/(TP_o+FN_o)
spec_opt = TN_o/(TN_o+FP_o)

print(f"\n[문제5] ROC AUC={roc_auc:.4f}, PR AUC={pr_auc:.4f}")
print(f"  최적 threshold={best_thr:.4f}")
print(f"  최적: Sensitivity={sens_opt:.4f}, Specificity={spec_opt:.4f}")
print(f"  t=0.5: Sensitivity={Sensitivity:.4f}, Specificity={Specificity:.4f}")

fig, axes = plt.subplots(1, 3, figsize=(17, 5))

# ROC
ax = axes[0]
ax.plot(fpr, tpr, color='steelblue', lw=2, label=f'ROC (AUC={roc_auc:.4f})')
ax.plot([0,1],[0,1],'k--',lw=1,label='Random')
ax.scatter(fpr[best_i], tpr[best_i], color='red', s=100, zorder=5,
           label=f'최적 t={best_thr:.3f}')
ax.fill_between(fpr, tpr, alpha=0.1, color='steelblue')
ax.set_xlabel('FPR (1-Specificity)'); ax.set_ylabel('TPR (Sensitivity)')
ax.set_title('ROC Curve', fontweight='bold'); ax.legend(); ax.grid(alpha=0.3)

# PR
ax = axes[1]
ax.plot(rec_arr, prec_arr, color='darkorange', lw=2, label=f'PR (AUC={pr_auc:.4f})')
ax.axhline(y_true.mean(), color='k', linestyle='--', lw=1,
           label=f'기준선={y_true.mean():.3f}')
ax.fill_between(rec_arr, prec_arr, alpha=0.1, color='darkorange')
ax.set_xlabel('Recall'); ax.set_ylabel('Precision')
ax.set_title('PR Curve', fontweight='bold'); ax.legend(); ax.grid(alpha=0.3)

# Threshold 비교
ax = axes[2]
x = np.arange(2); w = 0.35
ax.bar(x-w/2, [Sensitivity, sens_opt], w, label='Sensitivity', color='steelblue', alpha=0.8)
ax.bar(x+w/2, [Specificity, spec_opt], w, label='Specificity', color='darkorange', alpha=0.8)
ax.set_xticks(x); ax.set_xticklabels([f't=0.5', f'최적 t={best_thr:.3f}'])
ax.set_ylim(0, 1.15); ax.legend(); ax.grid(alpha=0.3, axis='y')
ax.set_title('Threshold 비교', fontweight='bold')
for i,(s,sp) in enumerate([(Sensitivity,Specificity),(sens_opt,spec_opt)]):
    ax.text(i-w/2, s+0.02, f'{s:.3f}', ha='center', fontsize=9)
    ax.text(i+w/2, sp+0.02, f'{sp:.3f}', ha='center', fontsize=9)

plt.suptitle('문제 5: ROC / PR Curve & 최적 Threshold', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(out/'fig_roc_pr_curves.png', dpi=150)
plt.close()
print(f"  ✅ ROC/PR Curve 저장")
print(f"\n✅ 모든 실행 완료. output/ 폴더 확인하세요.")
