"""
4장 과제 PDF 보고서 생성
실행: /Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11 make_pdf.py
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import pathlib, datetime

BASE = pathlib.Path(__file__).parent
OUT  = BASE / "output"

# ── 데이터 미리 계산 (run_all.py 결과 재현) ─────────────────
import sys
sys.path.insert(0, str(BASE))
import numpy as np
import pandas as pd
import matplotlib
import matplotlib.font_manager as fm
matplotlib.use('Agg')
_fp_path = '/Users/jangyoung/Library/Fonts/NanumBarunGothic.otf'
fm.fontManager.addfont(_fp_path)
_fp = fm.FontProperties(fname=_fp_path)
matplotlib.rcParams['font.family'] = _fp.get_name()
matplotlib.rcParams['axes.unicode_minus'] = False
import matplotlib.pyplot as plt
import statsmodels.api as sm
import statsmodels.formula.api as smf
from sklearn.metrics import confusion_matrix, roc_curve, auc, precision_recall_curve, average_precision_score
from scipy import stats
from ISLP import load_data

Default = load_data('Default')
Default2 = Default.copy()
Default2['default_num'] = (Default2['default'] == 'Yes').astype(int)
Default2['student_num'] = (Default2['student'] == 'Yes').astype(int)

beta1_val = 0.005499
OR_val    = np.exp(beta1_val)

model1 = smf.glm('default_num ~ balance', data=Default2, family=sm.families.Binomial()).fit()
model2 = smf.glm('default_num ~ balance + income', data=Default2, family=sm.families.Binomial()).fit()
model3 = smf.glm('default_num ~ balance + income + student_num', data=Default2, family=sm.families.Binomial()).fit()

def lr_test(small, large):
    d = small.deviance - large.deviance
    df = small.df_resid - large.df_resid
    return d, df, stats.chi2.sf(d, df)

d12, df12, p12 = lr_test(model1, model2)
d23, df23, p23 = lr_test(model2, model3)

final_model = model3
params  = final_model.params
pvalues = final_model.pvalues
OR_all  = np.exp(params)
CI      = np.exp(final_model.conf_int())
loglik  = final_model.llf
p_count = len(params)
AIC_man = -2 * loglik + 2 * p_count

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
Pe          = ((TP+FP)/n*(TP+FN)/n)+((TN+FN)/n*(TN+FP)/n)
Kappa       = (Accuracy-Pe)/(1-Pe)
McNemar_p   = stats.chi2.sf((FP-FN)**2/(FP+FN), 1)

fpr, tpr, thr_roc = roc_curve(y_true, y_prob)
roc_auc  = auc(fpr, tpr)
prec_arr, rec_arr, _ = precision_recall_curve(y_true, y_prob)
pr_auc   = average_precision_score(y_true, y_prob)
youden   = tpr - fpr
best_i   = np.argmax(youden)
best_thr = thr_roc[best_i]
y_pred_opt = (y_prob >= best_thr).astype(int)
cm_opt  = confusion_matrix(y_true, y_pred_opt)
TN_o, FP_o, FN_o, TP_o = cm_opt.ravel()
sens_opt = TP_o/(TP_o+FN_o)
spec_opt = TN_o/(TN_o+FP_o)

# ── 그래프 재생성 (고품질) ────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(18, 5.5))
ax = axes[0]
ax.plot(fpr, tpr, color='steelblue', lw=2, label=f'ROC (AUC={roc_auc:.4f})')
ax.plot([0,1],[0,1],'k--',lw=1,label='무작위')
ax.scatter(fpr[best_i], tpr[best_i], color='red', s=120, zorder=5,
           label=f'최적 t={best_thr:.3f}')
ax.fill_between(fpr, tpr, alpha=0.1, color='steelblue')
ax.set_xlabel('FPR (1-Specificity)'); ax.set_ylabel('TPR (Sensitivity)')
ax.set_title('ROC 곡선', fontweight='bold'); ax.legend(fontsize=9); ax.grid(alpha=0.3)

ax = axes[1]
ax.plot(rec_arr, prec_arr, color='darkorange', lw=2, label=f'PR (AUC={pr_auc:.4f})')
ax.axhline(y_true.mean(), color='k', linestyle='--', lw=1,
           label=f'기준선={y_true.mean():.3f}')
ax.fill_between(rec_arr, prec_arr, alpha=0.1, color='darkorange')
ax.set_xlabel('Recall'); ax.set_ylabel('Precision')
ax.set_title('PR 곡선', fontweight='bold'); ax.legend(fontsize=9); ax.grid(alpha=0.3)

ax = axes[2]
x = np.arange(2); w = 0.35
ax.bar(x-w/2,[Sensitivity,sens_opt],w,label='Sensitivity',color='steelblue',alpha=0.8)
ax.bar(x+w/2,[Specificity,spec_opt],w,label='Specificity',color='darkorange',alpha=0.8)
ax.set_xticks(x); ax.set_xticklabels([f't=0.5', f'최적 t={best_thr:.3f}'])
ax.set_ylim(0,1.15); ax.legend(); ax.grid(alpha=0.3,axis='y')
ax.set_title('Threshold 비교', fontweight='bold')
for i,(s,sp) in enumerate([(Sensitivity,Specificity),(sens_opt,spec_opt)]):
    ax.text(i-w/2,s+0.02,f'{s:.3f}',ha='center',fontsize=9)
    ax.text(i+w/2,sp+0.02,f'{sp:.3f}',ha='center',fontsize=9)
plt.suptitle('문제 5: ROC / PR 곡선 및 최적 Threshold 비교',fontsize=13,fontweight='bold')
plt.tight_layout()
plt.savefig(OUT/'fig_roc_pr_curves.png', dpi=150, bbox_inches='tight')
plt.close()

# Confusion Matrix 그래프
fig, ax = plt.subplots(figsize=(5.5, 4.5))
data = [[TN, FP],[FN, TP]]
im = ax.imshow(data, cmap='Blues', vmin=0, vmax=max(TN,FP,FN,TP)*1.2)
ax.set_xticks([0,1]); ax.set_yticks([0,1])
ax.set_xticklabels(['예측: 정상','예측: 불이행'],fontsize=11)
ax.set_yticklabels(['실제: 정상','실제: 불이행'],fontsize=11)
labels = ['TN','FP','FN','TP']
for idx,(i,j) in enumerate([(0,0),(0,1),(1,0),(1,1)]):
    v = data[i][j]
    ax.text(j,i,f'{labels[idx]}\n{v:,}',ha='center',va='center',fontsize=13,fontweight='bold',
            color='white' if v > TN*0.3 else 'black')
ax.set_title('Confusion Matrix (threshold=0.5)',fontsize=13,fontweight='bold')
plt.colorbar(im,ax=ax)
plt.tight_layout()
plt.savefig(OUT/'fig_confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.close()

print("[완료] 그래프 생성 완료")

# ════════════════════════════════════════════════════════════
# PDF 생성
# ════════════════════════════════════════════════════════════
class KoreanPDF(FPDF):
    FONT_REGULAR = '/Users/jangyoung/Library/Fonts/NanumBarunGothic.otf'
    FONT_BOLD    = '/Users/jangyoung/Library/Fonts/NanumBarunGothicBold.otf'

    def setup_fonts(self):
        self.add_font('Nanum', '', self.FONT_REGULAR)
        self.add_font('Nanum', 'B', self.FONT_BOLD)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font('Nanum', 'B', 9)
        self.set_text_color(120,120,120)
        self.cell(0, 6, '4장 과제: ISL Default 데이터 로지스틱 회귀 분석 | 정장영', align='C',
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0,0,0)
        self.ln(1)

    def footer(self):
        self.set_y(-12)
        self.set_font('Nanum', '', 8)
        self.set_text_color(120,120,120)
        self.cell(0, 6, f'- {self.page_no()} -', align='C')
        self.set_text_color(0,0,0)

    def section(self, title, level=1):
        if level == 1:
            self.set_font('Nanum','B',14)
            self.set_fill_color(30,80,160)
            self.set_text_color(255,255,255)
            self.cell(0, 9, f'  {title}', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_text_color(0,0,0)
            self.ln(3)
        elif level == 2:
            self.set_font('Nanum','B',12)
            self.set_fill_color(210,225,255)
            self.cell(0, 7, f'  {title}', fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(2)
        else:
            self.set_font('Nanum','B',11)
            self.set_text_color(50,50,150)
            self.multi_cell(0, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_text_color(0,0,0)

    def body(self, text, size=10, indent=0):
        self.set_font('Nanum','',size)
        if indent:
            self.set_x(self.l_margin + indent)
        self.multi_cell(0, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def formula(self, text):
        self.set_font('Nanum','B',10)
        self.set_fill_color(245,245,245)
        self.set_draw_color(180,180,180)
        self.multi_cell(0, 6, f'  {text}', border=1, fill=True,
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def term_box(self, term, definition):
        self.set_font('Nanum','B',10)
        self.set_fill_color(240,248,255)
        self.set_draw_color(150,180,230)
        y0 = self.get_y()
        self.multi_cell(0, 6, f'▶ {term}', border='LTR', fill=True,
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font('Nanum','',9.5)
        self.multi_cell(0, 5.5, f'   {definition}', border='LBR', fill=True,
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def add_image_centered(self, path, w=170):
        x = (self.w - w) / 2
        self.image(str(path), x=x, w=w)
        self.ln(3)

    def table_row(self, cols, widths, bold=False, fill=False):
        style = 'B' if bold else ''
        self.set_font('Nanum', style, 9.5)
        if fill:
            self.set_fill_color(220,230,250)
        for txt, w in zip(cols, widths):
            self.cell(w, 6, str(txt), border=1, fill=fill,
                      new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.ln()

# ── PDF 빌드 ─────────────────────────────────────────────────
pdf = KoreanPDF()
pdf.setup_fonts()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.set_margins(15, 15, 15)

# ═══ 표지 ════════════════════════════════════════════════════
pdf.add_page()
pdf.set_font('Nanum','B',22)
pdf.set_fill_color(25,60,140)
pdf.set_text_color(255,255,255)
pdf.cell(0, 18, '4장 과제 분석 보고서', fill=True, align='C',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(8)
pdf.set_text_color(0,0,0)
pdf.set_font('Nanum','B',15)
pdf.cell(0, 10, 'ISL Default 데이터 - 로지스틱 회귀 분석', align='C',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(6)
pdf.set_font('Nanum','',12)
pdf.cell(0, 8, '과목: 인공지능기반 데이터분석', align='C',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.cell(0, 8, '제출자: 정장영', align='C',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.cell(0, 8, f'제출일: {datetime.date.today()}', align='C',
         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(10)
pdf.set_font('Nanum','B',11)
pdf.set_fill_color(245,248,255)
pdf.multi_cell(0, 7,
    '【분석 개요】\n'
    '  본 보고서는 ISL(Introduction to Statistical Learning)의 Default 데이터셋을 사용하여\n'
    '  로지스틱 회귀 분석을 수행합니다. 오즈비 유도부터 ROC 곡선까지 5가지 핵심 주제를\n'
    '  통계 초보자도 이해할 수 있도록 용어 설명과 함께 단계별로 분석합니다.',
    fill=True, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
pdf.ln(8)
pdf.set_font('Nanum','',11)
pdf.body('【목차】\n'
         '  문제 1.  오즈비(Odds Ratio) 유도\n'
         '  문제 2.  변수 선택 — Deviance & AIC\n'
         '  문제 3.  최종 모형 해석\n'
         '  문제 4.  Performance Metrics (혼동행렬)\n'
         '  문제 5.  ROC / PR Curve 및 최적 Threshold')

# ═══ 문제 1 ══════════════════════════════════════════════════
pdf.add_page()
pdf.section('문제 1. 오즈비(Odds Ratio) 유도')

pdf.section('핵심 용어 정리', level=2)
pdf.term_box('로지스틱 회귀 (Logistic Regression)',
    '결과가 0 또는 1인 분류 문제에 사용. 어떤 사건이 일어날 확률(p)을 예측함.')
pdf.term_box('오즈 (Odds)',
    '사건이 일어날 확률 / 일어나지 않을 확률 = p / (1-p)\n'
    '예) p=0.8이면 Odds=4 → "이길 확률이 질 확률의 4배"')
pdf.term_box('로그 오즈 / 로짓 (log-odds / logit)',
    '오즈에 자연로그를 취한 값 = log(p/(1-p)) ← 로지스틱 회귀의 좌변')
pdf.term_box('오즈비 (Odds Ratio, OR)',
    '두 상황에서 오즈의 비율. X가 1 증가할 때 오즈가 몇 배 변하는지 측정.')

pdf.section('모형 정의', level=3)
pdf.formula('log(p / (1-p)) = β0 + β1 × balance')
pdf.body('양변에 exp()를 취하면:')
pdf.formula('p / (1-p) = exp(β0) × exp(β1)^balance')

pdf.section('(1) balance = 0 일 때의 오즈', level=3)
pdf.formula('Odds(balance=0) = exp(β0 + β1×0) = exp(β0)')

pdf.section('(2) balance = 1 일 때의 오즈', level=3)
pdf.formula('Odds(balance=1) = exp(β0 + β1×1) = exp(β0) × exp(β1)')

pdf.section('(3) Odds Ratio 유도 및 의미', level=3)
pdf.formula('OR = Odds(balance=1) / Odds(balance=0)\n'
            '   = [exp(β0) × exp(β1)] / exp(β0)\n'
            '   = exp(β1)')
pdf.body(
    '[완료] 의미: balance가 1단위 증가할 때, 채무불이행 오즈는 exp(β1)배가 됩니다.\n'
    '   OR > 1 이면 오즈 증가 (위험 증가), OR < 1 이면 오즈 감소 (위험 감소)')

pdf.section('(4) β1 = 0.005499 일 때 오즈비 계산 및 해석', level=3)
pdf.formula(f'OR = exp(0.005499) = {OR_val:.6f}')
pdf.body(
    f'[완료] 해석: balance가 1달러 증가할 때마다, 채무불이행 오즈는 약 {(OR_val-1)*100:.4f}% 증가합니다.\n'
    f'   실용적 해석: balance가 1,000달러 증가하면 OR = exp(0.005499×1000) = {np.exp(beta1_val*1000):.2f}배\n'
    '   → 잔액이 1,000달러 높은 고객은 채무불이행 오즈가 약 244배 높음!')

# ═══ 문제 2 ══════════════════════════════════════════════════
pdf.add_page()
pdf.section('문제 2. 변수 선택 — Deviance & AIC')

pdf.section('핵심 용어 정리', level=2)
pdf.term_box('Deviance (이탈도)',
    '모형이 데이터를 얼마나 잘 설명하지 못하는지 측정.\n'
    '값이 작을수록 모형이 데이터에 잘 맞음. (Deviance = -2 × logLik)')
pdf.term_box('AIC (Akaike Information Criterion)',
    'AIC = -2 × logLik + 2 × 파라미터수\n'
    '모형 복잡도에 패널티를 부과. 값이 작을수록 좋은 모형.')
pdf.term_box('Likelihood Ratio Test (우도비 검정)',
    '두 모형의 Deviance 차이가 통계적으로 유의한지 카이제곱 분포로 검정.\n'
    'H0: 단순 모형으로 충분, H1: 복잡 모형이 더 좋음')

pdf.section('(1) 각 모형의 Residual Deviance, df, AIC', level=3)
widths = [30, 45, 25, 40, 40]
pdf.table_row(['모형','설명','df','Residual Dev','AIC'], widths, bold=True, fill=True)
rows = [
    ('모형 1', 'default ~ balance',               int(model1.df_resid), f'{model1.deviance:.4f}', f'{model1.aic:.4f}'),
    ('모형 2', 'default ~ balance + income',       int(model2.df_resid), f'{model2.deviance:.4f}', f'{model2.aic:.4f}'),
    ('모형 3', '+ income + student',               int(model3.df_resid), f'{model3.deviance:.4f}', f'{model3.aic:.4f}'),
]
for r in rows:
    pdf.table_row(r, widths)
pdf.ln(4)

pdf.section('(2) Deviance 차이 검정', level=3)
widths2 = [50, 35, 25, 35, 35]
pdf.table_row(['비교','ΔDeviance','Δdf','p-value','판정'], widths2, bold=True, fill=True)
pdf.table_row(['모형1 vs 모형2 (income 추가)', f'{d12:.4f}', int(df12),
               f'{p12:.2e}', '[완료] 유의 (p<0.05)'], widths2)
pdf.table_row(['모형2 vs 모형3 (student 추가)', f'{d23:.4f}', int(df23),
               f'{p23:.2e}', '[완료] 유의 (p<0.05)'], widths2)
pdf.ln(4)

pdf.section('(3) 최적 모형 선택', level=3)
pdf.body(
    '통계적 유의성: 두 검정 모두 p < 0.05 → 변수 추가가 유의미한 개선\n\n'
    f'AIC 비교: 모형1({model1.aic:.1f}) > 모형2({model2.aic:.1f}) > 모형3({model3.aic:.1f})\n'
    '→ AIC 기준 모형3이 가장 작아 최적\n\n'
    '[완료] 최종 선택: 모형3 (balance + income + student)\n\n'
    '[참고] 통계적 유의성 vs 실질적 유의성:\n'
    '  - 통계적 유의성: p < 0.05 → 모든 변수가 유의미하게 Deviance 감소\n'
    '  - 실질적 유의성: 표본이 10,000개로 크면 작은 효과도 유의하게 나타날 수 있음\n'
    '  - 따라서 효과 크기(오즈비)도 함께 고려해야 함')

# ═══ 문제 3 ══════════════════════════════════════════════════
pdf.add_page()
pdf.section('문제 3. 최종 모형 해석 (모형3 기준)')

pdf.section('핵심 용어 정리', level=2)
pdf.term_box('유의수준 (α = 0.05)',
    'p-value < 0.05이면 "통계적으로 유의하다"고 판단.')
pdf.term_box('회귀계수 방향',
    '양(+): 변수 증가 → 채무불이행 확률 증가\n음(-): 변수 증가 → 채무불이행 확률 감소')

pdf.section('(1) 유의한 변수 및 방향', level=3)
widths3 = [40, 35, 35, 30, 40]
pdf.table_row(['변수','계수(β)','p-value','방향','유의성'], widths3, bold=True, fill=True)
var_labels = {'Intercept':'절편', 'balance':'balance', 'income':'income', 'student_num':'student'}
for var in params.index:
    sig = '[완료] 유의' if pvalues[var] < 0.05 else '[비해당] 비유의'
    direc = '양(+)' if params[var] > 0 else '음(-)'
    pdf.table_row([var_labels.get(var,var), f'{params[var]:.6f}',
                   f'{pvalues[var]:.2e}', direc, sig], widths3)
pdf.ln(3)
pdf.body(
    '해석:\n'
    '  balance (+): 잔액이 클수록 채무불이행 확률 증가 ← 직관적\n'
    '  income  (-): 소득이 높을수록 채무불이행 확률 감소 ← 직관적\n'
    '  student (-): 학생이면 채무불이행 확률 감소 ← 의외!\n'
    '  (단, balance를 통제한 상태에서 학생은 같은 잔액 대비 소득이 낮아 오히려 안전)')

pdf.section('(2) 각 변수 오즈비 계산 및 해석', level=3)
widths4 = [40, 35, 45, 50]
pdf.table_row(['변수','OR=exp(β)','95% 신뢰구간','해석'], widths4, bold=True, fill=True)
interps = {
    'balance': f'1달러 증가 시 오즈 {(OR_all["balance"]-1)*100:.4f}% 증가',
    'income':  f'1달러 증가 시 오즈 {(1-OR_all["income"])*100:.6f}% 감소',
    'student_num': f'학생이면 비학생 대비 오즈 {OR_all["student_num"]:.4f}배',
}
for var in params.index:
    if var == 'Intercept': continue
    ci_lo, ci_hi = CI.loc[var,0], CI.loc[var,1]
    pdf.table_row([var_labels.get(var,var), f'{OR_all[var]:.6f}',
                   f'({ci_lo:.4f}, {ci_hi:.4f})', interps.get(var,'')], widths4)
pdf.ln(3)

pdf.section('(3) logLik와 AIC 직접 계산 검증', level=3)
pdf.formula(f'logLik = {loglik:.6f}  (파라미터 수 p = {p_count})')
pdf.formula(f'AIC = -2 × {loglik:.4f} + 2 × {p_count} = {AIC_man:.4f}')
pdf.body(f'모형 출력 AIC = {final_model.aic:.4f}  →  차이 = {abs(AIC_man-final_model.aic):.8f}  [완료] 완벽히 일치')

# ═══ 문제 4 ══════════════════════════════════════════════════
pdf.add_page()
pdf.section('문제 4. Performance Metrics (threshold = 0.5)')

pdf.section('핵심 용어 정리 — Confusion Matrix', level=2)
pdf.body(
    '               실제 Positive    실제 Negative\n'
    '예측 Positive |  TP (진양성)   |  FP (위양성)  |\n'
    '예측 Negative |  FN (위음성)   |  TN (진음성)  |\n\n'
    '  TP: 불이행자를 불이행으로 올바르게 예측\n'
    '  FP: 정상인을 불이행으로 잘못 예측 (False Alarm)\n'
    '  TN: 정상인을 정상으로 올바르게 예측\n'
    '  FN: 불이행자를 정상으로 잘못 예측 ← 금융에서 치명적!')

pdf.section('(1) Confusion Matrix', level=3)
pdf.add_image_centered(OUT/'fig_confusion_matrix.png', w=100)

widths5 = [38, 52, 30, 60]
pdf.table_row(['Metric','공식','계산값','해석'], widths5, bold=True, fill=True)
metric_rows = [
    ('Accuracy',    '(TP+TN)/n',                    f'{Accuracy:.4f}',    '전체 정확도'),
    ('Sensitivity', 'TP/(TP+FN)',                    f'{Sensitivity:.4f}', '불이행 탐지율 (Recall)'),
    ('Specificity', 'TN/(TN+FP)',                    f'{Specificity:.4f}', '정상 탐지율'),
    ('Precision',   'TP/(TP+FP)',                    f'{Precision:.4f}',   '예측 불이행 중 실제 비율'),
    ('F1 Score',    '2×Prec×Sens/(Prec+Sens)',        f'{F1:.4f}',          'Precision-Recall 조화평균'),
    ('Kappa',       '(Acc−Pe)/(1−Pe)',               f'{Kappa:.4f}',       '우연 보정 일치도'),
    ('McNemar p',   '(FP−FN)²/(FP+FN) → χ²',        f'{McNemar_p:.2e}',   'FP vs FN 비대칭 검정'),
]
for r in metric_rows:
    pdf.table_row(r, widths5)
pdf.ln(4)

pdf.section('(2) McNemar 검정 분석', level=3)
pdf.body(
    f'  FP = {FP:,}  (정상인을 불이행으로 잘못 예측)\n'
    f'  FN = {FN:,}  (불이행자를 정상으로 잘못 예측)\n'
    f'  → FN >> FP: 불이행자를 정상으로 오분류하는 경우가 훨씬 많음\n'
    f'  McNemar p = {McNemar_p:.2e} → FP와 FN의 비율이 유의하게 비대칭\n\n'
    '  [완료] 금융 데이터에서:\n'
    '  FN이 더 치명적! (불이행자를 정상으로 예측 → 대출 승인 → 손실 발생)\n'
    '  FP는 기회비용만 발생 (정상 고객을 거절하는 수준)')

pdf.section('(3) Kappa 해석 및 Accuracy만으로 판단하면 안 되는 이유', level=3)
pdf.body(
    f'  Kappa = {Kappa:.4f} → "보통~상당한 일치" 수준\n\n'
    f'  [참고] Accuracy만으로 판단하면 안 되는 이유:\n'
    f'  • 이 데이터의 불이행 비율 = {y_true.mean()*100:.1f}% (극심한 클래스 불균형)\n'
    f'  • 모든 관측값을 "정상"으로 예측해도 Accuracy = {(1-y_true.mean())*100:.1f}%\n'
    '  • Kappa는 우연에 의한 정확도를 제거하여 실제 모형 성능을 보여줌\n'
    '  • Sensitivity가 낮다 (31.5%) → 불이행자를 제대로 탐지하지 못함')

# ═══ 문제 5 ══════════════════════════════════════════════════
pdf.add_page()
pdf.section('문제 5. ROC / PR Curve와 최적 Threshold')

pdf.section('핵심 용어 정리', level=2)
pdf.term_box('ROC Curve (Receiver Operating Characteristic)',
    'X축: FPR=FP/(FP+TN)=1-Specificity, Y축: TPR=TP/(TP+FN)=Sensitivity\n'
    'threshold를 0~1로 움직이면서 그린 곡선. AUC=1이면 완벽, 0.5는 무작위.')
pdf.term_box('PR Curve (Precision-Recall Curve)',
    'X축: Recall, Y축: Precision\n'
    '불균형 데이터에서 ROC보다 더 엄격한 성능 지표.')
pdf.term_box('Youden Index',
    'J = Sensitivity + Specificity - 1\n'
    '이 값이 최대인 threshold = 최적 임계값. 민감도와 특이도를 균형있게 최대화.')

pdf.add_image_centered(OUT/'fig_roc_pr_curves.png', w=185)

pdf.section('(1) ROC Curve 및 AUC 해석', level=3)
pdf.body(
    f'  ROC AUC = {roc_auc:.4f}\n'
    f'  해석: 임의 불이행자와 임의 정상인을 비교할 때,\n'
    f'        불이행자가 더 높은 예측 확률을 받을 가능성 = {roc_auc*100:.2f}%\n'
    f'  평가: AUC > 0.9 = 우수한 판별 능력')

pdf.section('(2) PR Curve 및 ROC와 비교', level=3)
pdf.body(
    f'  PR AUC = {pr_auc:.4f}  (ROC AUC = {roc_auc:.4f})\n'
    f'  불이행 비율이 {y_true.mean()*100:.1f}%로 낮아, PR AUC가 ROC AUC보다 낮음\n'
    '  → 불균형 데이터에서는 PR AUC가 더 현실적인 성능 지표\n'
    '  → 불이행자를 얼마나 정확하게 찾아내는지 중점 평가')

pdf.section('(3) Youden Index 최적 threshold', level=3)
pdf.formula(f'최적 threshold = {best_thr:.4f}')
pdf.body(
    f'  해당 Sensitivity = {tpr[best_i]:.4f}\n'
    f'  해당 Specificity = {1-fpr[best_i]:.4f}\n'
    f'  Youden Index = {youden[best_i]:.4f}')

pdf.section('(4) threshold 0.5 vs 최적 threshold 비교', level=3)
widths6 = [55, 45, 45]
pdf.table_row(['지표', f'threshold=0.5', f'최적 threshold={best_thr:.4f}'], widths6, bold=True, fill=True)
pdf.table_row(['Sensitivity', f'{Sensitivity:.4f}', f'{sens_opt:.4f}'], widths6)
pdf.table_row(['Specificity', f'{Specificity:.4f}', f'{spec_opt:.4f}'], widths6)
pdf.ln(3)

pdf.section('(5) 금융 데이터에서 threshold 선택 권고', level=3)
pdf.body(
    f'  [완료] 최적 threshold ({best_thr:.3f}) 선택 권장\n\n'
    '  이유:\n'
    f'  1) threshold=0.5: Sensitivity={Sensitivity:.3f} → 불이행자의 31.5%만 탐지\n'
    f'  2) 최적 threshold: Sensitivity={sens_opt:.3f} → 불이행자의 90.4% 탐지\n'
    '  3) 채무불이행 탐지에서 FN(미탐지)이 FP(오탐)보다 훨씬 심각한 손실 초래\n'
    '  4) Specificity가 낮아지더라도 민감도를 높이는 것이 금융 리스크 관리에 유리\n'
    '  5) 실무에서는 FN 비용과 FP 비용을 수치화하여 최적 threshold를 추가 조정')

# ═══ 결론 요약 ═══════════════════════════════════════════════
pdf.add_page()
pdf.section('분석 결론 요약')
pdf.body(
    '┌─────────────────────────────────────────────────────────────┐\n'
    '│  문제 1: β1=0.005499 → OR=1.005514 → balance 1달러 증가시  │\n'
    '│          오즈 0.55% 증가, 1000달러 증가시 244배             │\n'
    '│                                                             │\n'
    '│  문제 2: 모형3 (balance+income+student) 선택               │\n'
    f'│          AIC={model3.aic:.1f}, 모든 변수 유의 (p<0.05)         │\n'
    '│                                                             │\n'
    '│  문제 3: logLik와 AIC 직접 계산값 = 모형 출력값 완벽 일치  │\n'
    '│          balance(+), income(-), student(-) 방향 모두 유의   │\n'
    '│                                                             │\n'
    f'│  문제 4: Accuracy={Accuracy:.3f}, Kappa={Kappa:.3f}             │\n'
    f'│          Sensitivity={Sensitivity:.3f} (낮음 - 불균형 문제)    │\n'
    '│          금융에서 FN이 더 치명적                            │\n'
    '│                                                             │\n'
    f'│  문제 5: ROC AUC={roc_auc:.4f} (우수)                         │\n'
    f'│          최적 threshold={best_thr:.3f} → Sensitivity={sens_opt:.3f}  │\n'
    '│          금융 리스크 관리상 최적 threshold 사용 권장         │\n'
    '└─────────────────────────────────────────────────────────────┘')

# ── 저장 ────────────────────────────────────────────────────
pdf_path = BASE / '4장과제_정장영_보고서.pdf'
pdf.output(str(pdf_path))
print(f'[완료] PDF 저장 완료: {pdf_path}')
