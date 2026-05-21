"""
6장 과제: Train/Test Split + Ridge 회귀
실행: /Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11 run_all.py
"""
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
import pathlib, warnings
warnings.filterwarnings('ignore')

OUT = pathlib.Path(__file__).parent / "output"
OUT.mkdir(exist_ok=True)

# ── 1. 데이터 로드 및 전처리 ─────────────────────────────────
print("="*60)
print("1단계: 데이터 로드 및 전처리")
print("="*60)

Hitters = load_data('Hitters')
print(f"  원본 데이터: {Hitters.shape[0]}행 x {Hitters.shape[1]}열")
print(f"  결측값(NA) 수: {Hitters.isnull().sum().sum()}")

Hitters_clean = Hitters.dropna()
print(f"  결측 제거 후: {Hitters_clean.shape[0]}행 x {Hitters_clean.shape[1]}열")

# 범주형 변수 더미 인코딩
Hitters_encoded = pd.get_dummies(Hitters_clean, drop_first=True)

# X, y 분리
y = Hitters_encoded['Salary'].values
X = Hitters_encoded.drop('Salary', axis=1).values
feature_names = Hitters_encoded.drop('Salary', axis=1).columns.tolist()
print(f"\n  목표변수(y): Salary")
print(f"  설명변수(X): {X.shape[1]}개 변수")
print(f"  변수 목록: {feature_names[:5]}... 등")

# ── 2. Train/Test Split (set.seed=42, 70/30) ─────────────────
print("\n" + "="*60)
print("2단계: Train/Test Split")
print("="*60)

np.random.seed(42)  # set.seed(42) 재현성 보장
n = len(y)
train_idx = np.random.choice(n, size=int(n * 0.7), replace=False)
test_mask = np.ones(n, dtype=bool)
test_mask[train_idx] = False

X_train = X[train_idx];   y_train = y[train_idx]
X_test  = X[test_mask];   y_test  = y[test_mask]

print(f"  전체 샘플: {n}개")
print(f"  훈련 세트: {len(y_train)}개 ({len(y_train)/n*100:.0f}%)")
print(f"  테스트 세트: {len(y_test)}개 ({len(y_test)/n*100:.0f}%)")

# 표준화 (Ridge는 스케일에 민감)
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)   # fit은 train으로만!
X_test_s  = scaler.transform(X_test)         # test는 transform만
print(f"\n  [데이터 오염 방지 확인]")
print(f"  StandardScaler.fit(): X_train 전용 (X_test 절대 미사용) - OK")

# ── 3. 하이퍼파라미터 튜닝 (CV) ──────────────────────────────
print("\n" + "="*60)
print("3단계: CV로 최적 lambda(alpha) 선택")
print("="*60)
print("[중요] X_test, y_test는 이 단계에서 전혀 사용하지 않음!")

# 탐색할 lambda 범위 (alpha in sklearn = lambda in ISL)
alphas = np.logspace(-3, 5, 200)

# RidgeCV (기본 LOO CV 사용)
ridge_cv = RidgeCV(alphas=alphas, scoring='neg_mean_squared_error', cv=10)
ridge_cv.fit(X_train_s, y_train)
best_alpha = ridge_cv.alpha_
print(f"\n  탐색 lambda 범위: {alphas.min():.4f} ~ {alphas.max():.0f}")
print(f"  최적 lambda (alpha) = {best_alpha:.4f}")
print(f"  (10-fold CV on X_train, y_train only)")

# CV MSE vs lambda 시각화
cv_mse_list = []
for a in alphas:
    rdg = Ridge(alpha=a)
    scores = cross_val_score(rdg, X_train_s, y_train,
                             cv=10, scoring='neg_mean_squared_error')
    cv_mse_list.append(-scores.mean())

best_idx = np.argmin(cv_mse_list)
print(f"\n  최적 CV MSE = {cv_mse_list[best_idx]:.2f}")

fig, ax = plt.subplots(figsize=(9, 5))
ax.semilogx(alphas, cv_mse_list, color='steelblue', lw=2)
ax.axvline(best_alpha, color='red', linestyle='--', lw=1.5,
           label=f'최적 lambda={best_alpha:.2f}')
ax.scatter([best_alpha], [cv_mse_list[best_idx]], color='red', s=80, zorder=5)
ax.set_xlabel('Lambda (alpha, log scale)', fontsize=12)
ax.set_ylabel('CV MSE (10-fold)', fontsize=12)
ax.set_title('Ridge 회귀: Lambda vs CV MSE', fontsize=13, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUT/'fig_cv_lambda.png', dpi=150, bbox_inches='tight')
plt.close()
print(f"\n  그래프 저장: fig_cv_lambda.png")

# ── 4. 최종 모델 적합 (X_train 전체) ─────────────────────────
print("\n" + "="*60)
print("4단계: 최적 lambda로 최종 모델 적합 (X_train 전체)")
print("="*60)

final_model = Ridge(alpha=best_alpha)
final_model.fit(X_train_s, y_train)
print(f"  Ridge(lambda={best_alpha:.4f}).fit(X_train, y_train) 완료")
print(f"  절편(intercept): {final_model.intercept_:.4f}")
print(f"\n  상위 5개 회귀계수:")
coef_df = pd.DataFrame({'변수': feature_names, '계수': final_model.coef_})
top5 = coef_df.reindex(coef_df['계수'].abs().nlargest(5).index)
for _, row in top5.iterrows():
    print(f"    {row['변수']:20s}: {row['계수']:+.4f}")

# ── 5. 성능 평가 ─────────────────────────────────────────────
print("\n" + "="*60)
print("5단계: 훈련 MSE vs 테스트 MSE 비교")
print("="*60)

y_train_pred = final_model.predict(X_train_s)
y_test_pred  = final_model.predict(X_test_s)

train_mse = mean_squared_error(y_train, y_train_pred)
test_mse  = mean_squared_error(y_test,  y_test_pred)
train_rmse = np.sqrt(train_mse)
test_rmse  = np.sqrt(test_mse)

print(f"\n  훈련 MSE  = {train_mse:,.2f}")
print(f"  테스트 MSE = {test_mse:,.2f}")
print(f"\n  훈련 RMSE  = {train_rmse:,.2f} (달러 단위)")
print(f"  테스트 RMSE = {test_rmse:,.2f} (달러 단위)")
print(f"\n  과적합 정도: Test/Train MSE 비율 = {test_mse/train_mse:.4f}")

overfitting = (test_mse - train_mse) / train_mse * 100
print(f"\n  [해석]")
print(f"  훈련 MSE({train_mse:,.0f})보다 테스트 MSE({test_mse:,.0f})가")
print(f"  약 {overfitting:.1f}% {'높습니다' if overfitting > 0 else '낮습니다'}.")
if overfitting < 20:
    print(f"  Ridge 정규화 효과로 과적합이 잘 제어된 것으로 판단됩니다.")
    print(f"  일반화 성능(테스트 성능)이 양호합니다.")
else:
    print(f"  일부 과적합이 존재하나, Ridge 정규화로 억제된 상태입니다.")

# 실제 vs 예측 산점도
fig, axes = plt.subplots(1, 2, figsize=(13, 5))
for ax, y_true_p, y_pred_p, mse, title, color in [
    (axes[0], y_train, y_train_pred, train_mse, '훈련 세트', 'steelblue'),
    (axes[1], y_test,  y_test_pred,  test_mse,  '테스트 세트', 'darkorange'),
]:
    lims = [min(y_true_p.min(), y_pred_p.min())-50,
            max(y_true_p.max(), y_pred_p.max())+50]
    ax.scatter(y_true_p, y_pred_p, alpha=0.5, color=color, s=30)
    ax.plot(lims, lims, 'k--', lw=1.5, label='완벽한 예측선')
    ax.set_xlabel('실제 Salary', fontsize=11)
    ax.set_ylabel('예측 Salary', fontsize=11)
    ax.set_title(f'{title} (MSE={mse:,.0f})', fontsize=12, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(alpha=0.3)
plt.suptitle('Ridge 회귀: 실제 vs 예측 Salary', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(OUT/'fig_actual_vs_pred.png', dpi=150, bbox_inches='tight')
plt.close()
print(f"\n  그래프 저장: fig_actual_vs_pred.png")

# ── 6. 계수 경로 시각화 ───────────────────────────────────────
coefs_path = []
for a in alphas:
    rdg = Ridge(alpha=a)
    rdg.fit(X_train_s, y_train)
    coefs_path.append(rdg.coef_)
coefs_path = np.array(coefs_path)

fig, ax = plt.subplots(figsize=(10, 6))
for i in range(coefs_path.shape[1]):
    ax.semilogx(alphas, coefs_path[:, i], lw=1, alpha=0.6)
ax.axvline(best_alpha, color='red', linestyle='--', lw=2,
           label=f'최적 lambda={best_alpha:.2f}')
ax.set_xlabel('Lambda (log scale)', fontsize=12)
ax.set_ylabel('회귀계수', fontsize=12)
ax.set_title('Ridge 계수 경로 (lambda 증가 -> 계수 0으로 수렴)', fontsize=12, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(OUT/'fig_coef_path.png', dpi=150, bbox_inches='tight')
plt.close()
print(f"  그래프 저장: fig_coef_path.png")

# ── 결과 저장 ─────────────────────────────────────────────────
results = {
    'n_total': n, 'n_train': len(y_train), 'n_test': len(y_test),
    'best_alpha': best_alpha,
    'train_mse': train_mse, 'test_mse': test_mse,
    'train_rmse': train_rmse, 'test_rmse': test_rmse,
    'overfitting_pct': overfitting,
}
print(f"\n{'='*60}")
print("모든 계산 완료!")
print("="*60)
