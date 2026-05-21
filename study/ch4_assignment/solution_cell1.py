# ============================================================
# 4장 과제: ISL Default 데이터로 로지스틱 회귀 분석
# 과목: 인공지능기반 데이터분석
# ============================================================

# ── 패키지 설치 ──────────────────────────────────────────────
!pip install ISLP -q

# ── 패키지 로드 ──────────────────────────────────────────────
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import statsmodels.api as sm
import statsmodels.formula.api as smf
from sklearn.metrics import (
    confusion_matrix, accuracy_score,
    roc_curve, auc,
    precision_recall_curve, average_precision_score
)
from scipy import stats
from ISLP import load_data

# ── 한글 폰트 설정 (Colab 환경) ────────────────────────────
import matplotlib
matplotlib.rcParams['axes.unicode_minus'] = False
try:
    import japanize_matplotlib
except ImportError:
    pass

# ── 데이터 로드 ──────────────────────────────────────────────
Default = load_data('Default')
print("=" * 60)
print("📊 Default 데이터셋 기본 정보")
print("=" * 60)
print(f"행(관측값) 수: {Default.shape[0]:,}개")
print(f"열(변수)  수: {Default.shape[1]}개")
print()
print("변수 설명:")
print("  default : 채무불이행 여부 (Yes=불이행, No=정상)")
print("  student : 학생 여부 (Yes=학생, No=비학생)")
print("  balance : 신용카드 잔액 (단위: 달러)")
print("  income  : 연간 소득 (단위: 달러)")
print()
print(Default.head(10))
print()
print("채무불이행 비율:")
print(Default['default'].value_counts(normalize=True).round(4) * 100, "%")
