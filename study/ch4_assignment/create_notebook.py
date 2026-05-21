"""Convert solution Python files into a single Colab-ready .ipynb"""
import json, pathlib

base = pathlib.Path(__file__).parent
cell_files = sorted(base.glob("solution_cell*.py"))

def make_code_cell(source: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source.splitlines(keepends=True),
    }

def make_md_cell(source: str) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": source.splitlines(keepends=True),
    }

cells = []

# Title markdown
cells.append(make_md_cell(
    "# 4장 과제: ISL Default 데이터 로지스틱 회귀 분석\n"
    "**과목**: 인공지능기반 데이터분석 | **제출자**: 정장영\n\n"
    "---\n"
    "**분석 목표**: Default 데이터를 이용하여 로지스틱 회귀 모형을 적합하고,\n"
    "오즈비 유도 / 변수 선택 / 모형 해석 / 성능 평가 / ROC·PR 곡선을 분석한다.\n"
))

section_titles = [
    "## 환경 설정 및 데이터 로드",
    "## 문제 1. 오즈비(Odds Ratio) 유도",
    "## 문제 2. 변수 선택 — Deviance & AIC",
    "## 문제 3. 최종 모형 해석",
    "## 문제 4. Performance Metrics",
    "## 문제 5. ROC / PR Curve 및 최적 Threshold",
]

for i, cf in enumerate(cell_files):
    title = section_titles[i] if i < len(section_titles) else f"## 셀 {i+1}"
    cells.append(make_md_cell(title))
    cells.append(make_code_cell(cf.read_text()))

nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {"name": "python", "version": "3.10.0"},
        "colab": {"provenance": []},
    },
    "cells": cells,
}

out = base / "4장과제_정장영.ipynb"
out.write_text(json.dumps(nb, ensure_ascii=False, indent=2))
print(f"✅ Notebook created: {out}")
print(f"   Cells: {len(cells)}")
