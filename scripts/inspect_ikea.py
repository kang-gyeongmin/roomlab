
from pathlib import Path

import pandas as pd

CSV_PATH = Path("public/ikea.csv")


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV 파일을 찾을 수 없습니다: {CSV_PATH}")

    df = pd.read_csv(CSV_PATH)

    print("\n=== 기본 정보 ===")
    print(f"행 수: {len(df):,}")
    print(f"열 수: {len(df.columns)}")

    print("\n=== 열 이름과 데이터 타입 ===")
    print(df.dtypes.to_string())

    print("\n=== 앞의 5개 행 ===")
    print(df.head().to_string())

    print("\n=== 결측치 개수 ===")
    print(df.isna().sum().sort_values(ascending=False).to_string())

    print("\n=== 완전히 중복된 행 ===")
    print(f"{df.duplicated().sum():,}개")

    print("\n=== 메모리 사용량 ===")
    print(f"{df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")


if __name__ == "__main__":
    main()
