
from pathlib import Path

import pandas as pd

CSV_PATH = Path("public/ikea.csv")


def main() -> None:
    df = pd.read_csv(CSV_PATH)

    print("=== IKEA 데이터 품질 검사 ===")
    print(f"전체 상품 행 수: {len(df):,}")

    # 1. 필수 열이 존재하는지 검사
    required_columns = [
        "item_id",
        "name",
        "category",
        "price",
        "depth",
        "height",
        "width",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    print("\n[1] 필수 열 검사")
    if missing_columns:
        print(f"실패: 없는 열 {missing_columns}")
    else:
        print("통과: 필수 열이 모두 존재합니다.")

    # 이후 검사는 필수 열이 있을 때만 실행
    if missing_columns:
        return

    # 2. 상품 ID 중복 검사
    print("\n[2] 상품 ID 중복 검사")
    duplicate_ids = df["item_id"].duplicated(keep=False)
    print(f"중복 ID 행 수: {duplicate_ids.sum():,}")

    # 3. 가격 검사
    print("\n[3] 가격 검사")
    invalid_price = df["price"].isna() | (df["price"] < 0)
    print(f"결측 또는 음수 가격 행 수: {invalid_price.sum():,}")

    # 4. 치수 결측 검사
    dimensions = ["depth", "height", "width"]
    missing_dimensions = df[dimensions].isna().sum()

    print("\n[4] 치수별 결측치")
    print(missing_dimensions.to_string())

    # 5. 3D 배치용 치수 완전성 검사
    missing_any_dimension = df[dimensions].isna().any(axis=1)
    complete_dimensions = ~missing_any_dimension

    print("\n[5] 3D 배치용 치수")
    print(f"치수가 모두 있는 상품: {complete_dimensions.sum():,}")
    print(f"하나 이상 빠진 상품: {missing_any_dimension.sum():,}")

    # 6. 0 이하인 치수 검사
    invalid_dimensions = (
        df[dimensions].notna()
        & (df[dimensions] <= 0)
    ).any(axis=1)

    print("\n[6] 0 이하인 치수가 있는 상품")
    print(f"해당 상품 행 수: {invalid_dimensions.sum():,}")

    # 7. 카테고리별 상품 수
    print("\n[7] 상품 수가 많은 카테고리 상위 10개")
    print(df["category"].value_counts().head(10).to_string())


if __name__ == "__main__":
    main()
