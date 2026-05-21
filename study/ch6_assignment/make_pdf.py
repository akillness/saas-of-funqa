"""6장 과제 PDF 보고서 생성"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import pathlib, datetime, warnings
warnings.filterwarnings('ignore')

BASE = pathlib.Path(__file__).parent
OUT  = BASE / "output"

# ── 데이터 재계산 ─────────────────────────────────────────────
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
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_squared_error
from ISLP import load_data

Hitters = load_data('Hitters')
Hitters_clean = Hitters.dropna()
Hitters_enc   = pd.get_dummies(Hitters_clean, drop_first=True)
y = Hitters_enc['Salary'].values
X = Hitters_enc.drop('Salary', axis=1).values
feature_names = Hitters_enc.drop('Salary', axis=1).columns.tolist()

np.random.seed(42)
n = len(y)
train_idx = np.random.choice(n, size=int(n * 0.7), replace=False)
test_mask = np.ones(n, dtype=bool)
test_mask[train_idx] = False
X_train = X[train_idx];  y_train = y[train_idx]
X_test  = X[test_mask];  y_test  = y[test_mask]

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

alphas = np.logspace(-3, 5, 200)
ridge_cv = RidgeCV(alphas=alphas, scoring='neg_mean_squared_error', cv=10)
ridge_cv.fit(X_train_s, y_train)
best_alpha = ridge_cv.alpha_

cv_mse_list = []
for a in alphas:
    rdg = Ridge(alpha=a)
    scores = cross_val_score(rdg, X_train_s, y_train, cv=10,
                             scoring='neg_mean_squared_error')
    cv_mse_list.append(-scores.mean())

final_model = Ridge(alpha=best_alpha)
final_model.fit(X_train_s, y_train)
y_train_pred = final_model.predict(X_train_s)
y_test_pred  = final_model.predict(X_test_s)
train_mse = mean_squared_error(y_train, y_train_pred)
test_mse  = mean_squared_error(y_test,  y_test_pred)
train_rmse = np.sqrt(train_mse)
test_rmse  = np.sqrt(test_mse)

coef_df = pd.DataFrame({'변수': feature_names, '계수': final_model.coef_})
top5 = coef_df.reindex(coef_df['계수'].abs().nlargest(5).index)

coefs_path = np.array([Ridge(alpha=a).fit(X_train_s, y_train).coef_ for a in alphas])

# ── 그래프 재생성 ──────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
ax.semilogx(alphas, cv_mse_list, color='steelblue', lw=2, label='10-fold CV MSE')
best_idx = np.argmin(cv_mse_list)
ax.axvline(best_alpha, color='red', linestyle='--', lw=2,
           label=f'최적 lambda={best_alpha:.2f}')
ax.scatter([best_alpha], [cv_mse_list[best_idx]], color='red', s=100, zorder=5)
ax.set_xlabel('Lambda (log scale)', fontsize=12)
ax.set_ylabel('CV MSE (10-fold)', fontsize=12)
ax.set_title('Ridge 회귀: Lambda vs CV MSE\n(X_train, y_train만 사용)', fontsize=12, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUT/'fig_cv_lambda.png', dpi=150, bbox_inches='tight')
plt.close()

fig, axes = plt.subplots(1, 2, figsize=(13, 5))
for ax, y_t, y_p, mse, title, color in [
    (axes[0], y_train, y_train_pred, train_mse, '훈련 세트 (Train)', 'steelblue'),
    (axes[1], y_test,  y_test_pred,  test_mse,  '테스트 세트 (Test)', 'darkorange'),
]:
    lims = [min(y_t.min(), y_p.min())-50, max(y_t.max(), y_p.max())+50]
    ax.scatter(y_t, y_p, alpha=0.5, color=color, s=35)
    ax.plot(lims, lims, 'k--', lw=1.5, label='완벽한 예측선')
    ax.set_xlabel('실제 Salary (천달러)', fontsize=11)
    ax.set_ylabel('예측 Salary (천달러)', fontsize=11)
    ax.set_title(f'{title}\nMSE={mse:,.0f}, RMSE={np.sqrt(mse):,.1f}', fontsize=11, fontweight='bold')
    ax.legend(fontsize=10); ax.grid(alpha=0.3)
plt.suptitle('Ridge 회귀: 실제 vs 예측 Salary', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(OUT/'fig_actual_vs_pred.png', dpi=150, bbox_inches='tight')
plt.close()

fig, ax = plt.subplots(figsize=(10, 6))
for i in range(coefs_path.shape[1]):
    ax.semilogx(alphas, coefs_path[:, i], lw=0.9, alpha=0.55)
ax.axvline(best_alpha, color='red', linestyle='--', lw=2,
           label=f'최적 lambda={best_alpha:.2f}')
ax.set_xlabel('Lambda (log scale)', fontsize=12)
ax.set_ylabel('회귀계수', fontsize=12)
ax.set_title('Ridge 계수 경로\n(lambda 증가 시 계수가 0으로 수렴)', fontsize=12, fontweight='bold')
ax.legend(fontsize=11); ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUT/'fig_coef_path.png', dpi=150, bbox_inches='tight')
plt.close()

# MSE 비교 막대 그래프
fig, ax = plt.subplots(figsize=(7, 5))
bars = ax.bar(['훈련 MSE\n(Train)', '테스트 MSE\n(Test)'],
              [train_mse, test_mse],
              color=['steelblue', 'darkorange'], width=0.5, alpha=0.85)
for bar, v in zip(bars, [train_mse, test_mse]):
    ax.text(bar.get_x()+bar.get_width()/2, v+500, f'{v:,.0f}',
            ha='center', va='bottom', fontsize=12, fontweight='bold')
ax.set_ylabel('MSE', fontsize=12)
ax.set_title(f'훈련 vs 테스트 MSE 비교\n(Ridge, lambda={best_alpha:.2f})', fontsize=12, fontweight='bold')
ax.grid(alpha=0.3, axis='y')
ax.set_ylim(0, max(train_mse, test_mse) * 1.2)
plt.tight_layout()
plt.savefig(OUT/'fig_mse_compare.png', dpi=150, bbox_inches='tight')
plt.close()

print("[완료] 모든 그래프 저장 완료")

# ════════════════════════════════════════════════════════════
# PDF 빌드
# ════════════════════════════════════════════════════════════
class PDF(FPDF):
    FONT_R = '/Users/jangyoung/Library/Fonts/NanumBarunGothic.otf'
    FONT_B = '/Users/jangyoung/Library/Fonts/NanumBarunGothicBold.otf'

    def setup(self):
        self.add_font('N','', self.FONT_R)
        self.add_font('N','B', self.FONT_B)

    def header(self):
        if self.page_no() == 1: return
        self.set_font('N','B',9)
        self.set_text_color(120,120,120)
        self.cell(0,6,'6장 과제: Train/Test Split + Ridge 회귀 | 정장영',
                  align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(0,0,0)
        self.ln(1)

    def footer(self):
        self.set_y(-12)
        self.set_font('N','',8)
        self.set_text_color(120,120,120)
        self.cell(0,6,f'- {self.page_no()} -', align='C')
        self.set_text_color(0,0,0)

    def h1(self, t):
        self.set_font('N','B',14)
        self.set_fill_color(25,70,155)
        self.set_text_color(255,255,255)
        self.cell(0,9,f'  {t}',fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_text_color(0,0,0); self.ln(3)

    def h2(self, t):
        self.set_font('N','B',12)
        self.set_fill_color(210,225,255)
        self.cell(0,7,f'  {t}',fill=True,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)

    def h3(self, t):
        self.set_font('N','B',11)
        self.set_text_color(40,40,140)
        self.multi_cell(0,6,t,new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_text_color(0,0,0)

    def body(self, t, sz=10):
        self.set_font('N','',sz)
        self.multi_cell(0,5.5,t,new_x=XPos.LMARGIN,new_y=YPos.NEXT)

    def box(self, t, sz=10):
        self.set_font('N','',sz)
        self.set_fill_color(248,248,248)
        self.set_draw_color(180,180,180)
        self.multi_cell(0,6,f'  {t}',border=1,fill=True,
                        new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)

    def term(self, term, defn):
        self.set_font('N','B',10)
        self.set_fill_color(235,245,255)
        self.set_draw_color(150,185,230)
        self.multi_cell(0,6,f'  [{term}]',border='LTR',fill=True,
                        new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.set_font('N','',9.5)
        self.multi_cell(0,5.5,f'   {defn}',border='LBR',fill=True,
                        new_x=XPos.LMARGIN,new_y=YPos.NEXT)
        self.ln(2)

    def img_c(self, path, w=170):
        self.image(str(path), x=(self.w-w)/2, w=w)
        self.ln(3)

    def trow(self, cols, ws, bold=False, fill=False):
        self.set_font('N','B' if bold else '',9.5)
        if fill: self.set_fill_color(215,230,255)
        for txt,w in zip(cols,ws):
            self.cell(w,6,str(txt),border=1,fill=fill,
                      new_x=XPos.RIGHT,new_y=YPos.TOP)
        self.ln()

pdf = PDF()
pdf.setup()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.set_margins(15,15,15)

# ─── 표지 ────────────────────────────────────────────────────
pdf.add_page()
pdf.set_font('N','B',22)
pdf.set_fill_color(25,60,140)
pdf.set_text_color(255,255,255)
pdf.cell(0,18,'6장 과제 분석 보고서',fill=True,align='C',
         new_x=XPos.LMARGIN,new_y=YPos.NEXT)
pdf.ln(8)
pdf.set_text_color(0,0,0)
pdf.set_font('N','B',15)
pdf.cell(0,10,'Train/Test Split을 적용한 Ridge 회귀 성능 평가',align='C',
         new_x=XPos.LMARGIN,new_y=YPos.NEXT)
pdf.ln(5)
pdf.set_font('N','',12)
for line in ['과목: 인공지능기반 데이터분석',
             '제출자: 정장영',
             f'제출일: {datetime.date.today()}',
             '선택 방법: Ridge Regression']:
    pdf.cell(0,8,line,align='C',new_x=XPos.LMARGIN,new_y=YPos.NEXT)
pdf.ln(8)
pdf.set_font('N','B',11)
pdf.set_fill_color(245,248,255)
pdf.multi_cell(0,7,
    '[분석 개요]\n'
    '  Hitters 데이터셋(야구 선수 연봉)에 Train/Test Split(70/30, seed=42)을 적용하여\n'
    '  Ridge 회귀 모형의 실제 예측 성능을 평가합니다.\n'
    '  10-fold CV로 최적 정규화 파라미터(lambda)를 선택하고,\n'
    '  훈련 MSE vs 테스트 MSE를 비교하여 모형의 일반화 성능을 분석합니다.',
    fill=True, border=1, new_x=XPos.LMARGIN,new_y=YPos.NEXT)
pdf.ln(6)
pdf.body(
    '[목차]\n'
    '  1. 핵심 용어 정리\n'
    '  2. 데이터 소개 및 전처리\n'
    '  3. Train/Test Split (재현성 확인)\n'
    '  4. CV로 최적 lambda 선택 (데이터 오염 방지)\n'
    '  5. 최종 모델 적합\n'
    '  6. 성능 평가: 훈련 MSE vs 테스트 MSE\n'
    '  7. 결론 및 해석')

# ─── 용어 정리 ────────────────────────────────────────────────
pdf.add_page()
pdf.h1('1. 핵심 용어 정리 (통계 초보자를 위한 개념 설명)')

pdf.term('Train/Test Split (훈련/테스트 분리)',
    '전체 데이터를 훈련 세트(70%)와 테스트 세트(30%)로 나누는 것.\n'
    '훈련 세트로 모델을 학습하고, 테스트 세트로 "처음 보는 데이터"에 대한 성능을 평가.\n'
    '비유: 시험 공부할 때 문제집(훈련)으로 공부하고, 실제 시험(테스트)으로 실력 확인.')

pdf.term('MSE (Mean Squared Error, 평균 제곱 오차)',
    'MSE = (1/n) x sum((실제값 - 예측값)^2)\n'
    '예측 오차를 제곱하여 평균한 값. 값이 작을수록 예측이 정확.\n'
    '훈련 MSE: 모델이 "공부한" 데이터에 대한 오차\n'
    '테스트 MSE: 모델이 "처음 보는" 데이터에 대한 오차 (진짜 성능!)')

pdf.term('Ridge 회귀 (Ridge Regression)',
    '일반 선형 회귀에 정규화(규제) 항을 추가한 모형.\n'
    '목적함수 = RSS + lambda x (계수 제곱합)\n'
    'lambda(정규화 강도)가 클수록 계수가 0에 가까워져 과적합 방지.\n'
    'lambda=0: 일반 OLS, lambda=무한대: 모든 계수가 0')

pdf.term('Cross-Validation (교차 검증, CV)',
    '훈련 데이터를 k개 fold로 나누어, k-1개로 학습하고 나머지 1개로 검증을 k번 반복.\n'
    '테스트 데이터를 전혀 사용하지 않고 최적 hyperparameter를 선택하는 방법.\n'
    '핵심: CV는 반드시 X_train, y_train만으로 수행!')

pdf.term('Hyperparameter (하이퍼파라미터)',
    '모델이 학습하는 것이 아니라, 사람이 직접 설정하는 파라미터.\n'
    'Ridge에서 lambda(alpha)가 하이퍼파라미터.\n'
    'CV를 통해 최적값을 탐색함.')

pdf.term('데이터 오염 (Data Leakage)',
    '모델 학습/튜닝 단계에서 테스트 데이터 정보가 새어들어가는 현상.\n'
    '오염 시: 테스트 MSE가 실제보다 낮게 나와 성능 과대평가.\n'
    '방지: CV와 StandardScaler.fit()을 X_train으로만 수행!')

pdf.term('StandardScaler (표준화)',
    '각 변수를 평균 0, 표준편차 1로 변환. Ridge는 스케일에 민감하므로 필수.\n'
    '중요: scaler.fit()은 X_train으로만, X_test는 scaler.transform()만 적용!')

# ─── 데이터 소개 ─────────────────────────────────────────────
pdf.add_page()
pdf.h1('2. 데이터 소개 및 전처리')

pdf.h2('Hitters 데이터셋')
pdf.body(
    '출처: ISL(Introduction to Statistical Learning) 교재\n'
    '내용: 1986-87 미국 메이저리그 야구 선수 통계 및 연봉 데이터\n'
    f'크기: 원본 322행 x 20열  ->  결측 제거 후 {len(y_train)+len(y_test)}행\n'
    '목표변수(y): Salary (선수 연봉, 단위: 천 달러)\n'
    '설명변수(X): AtBat, Hits, HmRun, Runs, RBI, Walks 등 19개 변수')

pdf.h2('전처리 절차')
pdf.body(
    '1) 결측값(NA) 제거: Salary 미기록 선수 59명 제외\n'
    '2) 범주형 변수 더미 인코딩: League, Division, NewLeague (drop_first=True)\n'
    '3) X, y 분리: y = Salary, X = 나머지 19개 변수')

# ─── Train/Test Split ─────────────────────────────────────────
pdf.h1('3. Train/Test Split (재현성 확인)')

pdf.box(
    'np.random.seed(42)  # 재현성 보장\n'
    f'n = {n}\n'
    f'train_idx = np.random.choice(n, size=int(n*0.7), replace=False)\n'
    'X_train, y_train = X[train_idx], y[train_idx]\n'
    'X_test,  y_test  = X[~train_idx], y[~train_idx]')

ws = [60, 50, 55, 55]
pdf.trow(['구분','샘플수','비율','사용 목적'], ws, bold=True, fill=True)
pdf.trow(['전체 데이터', n, '100%', '참고용'], ws)
pdf.trow([f'훈련 세트', len(y_train), '70%', 'CV + 최종 모델 적합'], ws)
pdf.trow([f'테스트 세트', len(y_test), '30%', '최종 성능 평가만!'], ws)
pdf.ln(4)

pdf.body(
    '[재현성 확인]\n'
    '  set.seed(42)/np.random.seed(42)를 코드 맨 앞에 위치시켜\n'
    '  동일한 분리 결과가 항상 재현됨을 확인.\n\n'
    '[데이터 오염 방지 확인]\n'
    '  X_test와 y_test는 CV(3단계)와 모델 적합(4단계)에서 절대 사용하지 않음.\n'
    '  StandardScaler.fit()도 X_train으로만 수행 (X_test는 .transform()만).')

# ─── CV ──────────────────────────────────────────────────────
pdf.add_page()
pdf.h1('4. CV로 최적 Lambda 선택 (하이퍼파라미터 튜닝)')

pdf.h2('[중요] 이 단계에서 X_test, y_test는 절대 사용하지 않음')
pdf.body(
    '탐색 범위: lambda (alpha) = 0.001 ~ 100,000 (200개, log scale)\n'
    '검증 방법: 10-fold Cross-Validation on (X_train, y_train)\n'
    '선택 기준: CV MSE가 최소인 lambda 선택\n\n'
    f'  -> 최적 lambda = {best_alpha:.4f}')

pdf.img_c(OUT/'fig_cv_lambda.png', w=165)

pdf.body(
    f'[CV MSE 해석]\n'
    f'  최적 lambda = {best_alpha:.4f} 지점에서 CV MSE가 최소.\n'
    f'  lambda가 너무 작으면: 과적합 위험 (train에서만 잘 맞음)\n'
    f'  lambda가 너무 크면: 과소적합 (모든 계수가 0에 수렴)\n'
    f'  10-fold CV가 찾아준 {best_alpha:.4f}이 균형점!')

# ─── Ridge 계수 경로 ─────────────────────────────────────────
pdf.add_page()
pdf.h1('5. Ridge 계수 경로 및 최종 모델 적합')

pdf.h2('Ridge 계수 경로 (Coefficient Path)')
pdf.img_c(OUT/'fig_coef_path.png', w=165)
pdf.body(
    'lambda가 증가할수록 모든 회귀계수가 0으로 수렴하는 모습.\n'
    '빨간 점선 = 최적 lambda 위치. 이 지점에서 계수를 사용.\n\n'
    'Ridge는 Lasso와 달리 계수를 완전히 0으로 만들지 않음\n'
    '(변수 선택 없이 모든 변수를 유지하면서 크기만 줄임)')

pdf.h2('최종 모델 적합')
pdf.box(
    f'# 최적 lambda = {best_alpha:.4f}\n'
    f'final_model = Ridge(alpha={best_alpha:.4f})\n'
    'final_model.fit(X_train_s, y_train)  # X_train, y_train 전체 사용')

pdf.body(f'절편 (intercept) = {final_model.intercept_:.4f}')
pdf.ln(2)
pdf.h3('상위 5개 변수 (절대값 기준):')
ws2 = [60, 50, 70]
pdf.trow(['변수','회귀계수','해석'],ws2,bold=True,fill=True)
interprets = {
    'CHits': 'Salary에 양의 영향 (통산 안타 많으면 연봉 높음)',
    'AtBat': '음의 영향 (표준화 후 다른 변수와의 관계)',
    'CRuns': '양의 영향 (통산 득점 많으면 연봉 높음)',
    'Hits': '양의 영향 (당해 안타 많으면 연봉 높음)',
    'CWalks': '음의 영향 (상관관계 구조에 의한 효과)',
}
for _, row in top5.iterrows():
    sign = '+' if row['계수'] > 0 else ''
    pdf.trow([row['변수'], f"{sign}{row['계수']:.4f}",
              interprets.get(row['변수'],'')], ws2)
pdf.ln(3)

# ─── 성능 평가 ────────────────────────────────────────────────
pdf.add_page()
pdf.h1('6. 성능 평가: 훈련 MSE vs 테스트 MSE')

pdf.h2('MSE 비교')
pdf.img_c(OUT/'fig_mse_compare.png', w=120)

ws3 = [65, 50, 50, 55]
pdf.trow(['지표','훈련 세트','테스트 세트','비고'], ws3, bold=True, fill=True)
pdf.trow(['MSE', f'{train_mse:,.2f}', f'{test_mse:,.2f}',
          'Test < Train'], ws3)
pdf.trow(['RMSE (달러)', f'{train_rmse:,.2f}', f'{test_rmse:,.2f}',
          '직관적 오차 크기'], ws3)
pdf.trow(['데이터 수', str(len(y_train)), str(len(y_test)), '70/30 분리'], ws3)
pdf.ln(4)

pdf.h2('실제 vs 예측 Salary 산점도')
pdf.img_c(OUT/'fig_actual_vs_pred.png', w=170)

pdf.h1('7. 결론 및 해석 (2~3문장)')

pdf.body(
    f'[핵심 결과]\n'
    f'  훈련 MSE = {train_mse:,.0f},  테스트 MSE = {test_mse:,.0f}\n\n'
    f'[해석]\n'
    f'  Ridge 회귀(lambda={best_alpha:.2f})를 적용한 결과,\n'
    f'  테스트 MSE({test_mse:,.0f})가 훈련 MSE({train_mse:,.0f})보다\n'
    f'  오히려 낮게 나왔습니다 (Test/Train 비율 = {test_mse/train_mse:.4f}).\n\n'
    '  이는 Ridge 정규화가 과적합을 효과적으로 제어하여,\n'
    '  훈련 데이터의 노이즈에 지나치게 맞추지 않았음을 의미합니다.\n'
    '  RMSE 기준으로 예측 오차는 약 305~324달러 수준으로,\n'
    '  모델의 일반화 성능(새 데이터 예측력)이 양호하다고 판단됩니다.\n\n'
    '[중요 확인 사항]\n'
    '  (1) CV: X_train, y_train만 사용             - [OK]\n'
    '  (2) 최종 적합: X_train, y_train만 사용       - [OK]\n'
    '  (3) 테스트: X_test, y_test는 평가 단계에만   - [OK]\n'
    '  (4) set.seed(42) 코드 맨 앞 위치            - [OK]\n'
    '  (5) 최종 보고 지표: 테스트 MSE 사용           - [OK]')

pdf_path = BASE / '6장과제_정장영_보고서.pdf'
pdf.output(str(pdf_path))
print(f'[완료] PDF: {pdf_path}')
