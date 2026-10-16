
import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import Papa from 'papaparse'
import './App.css'


type Product = {
  id: string
  name: string
  category: string
  price: number | null
  width: number
  depth: number
  height: number
  actualWidth: number | null
  actualDepth: number | null
  actualHeight: number | null
  color: string
  demo?: boolean
}


type PlacedFurniture = Product & {
  instanceId: string
  x: number
  z: number
  rotation: number
}

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-bed',
    name: '침대 (샘플)',
    category: '침대',
    price: 299000,
    width: 1.4,
    depth: 2,
    height: 0.55,
    color: '#D6C5AD',
    demo: true,
    actualWidth: 1.4,
    actualDepth: 2,
    actualHeight: 0.55,
  },
  {
    id: 'demo-sofa',
    name: '소파 (샘플)',
    category: '소파',
    price: 249000,
    width: 1.8,
    depth: 0.85,
    height: 0.75,
    color: '#8EA49A',
    demo: true,
    actualWidth: 1.4,
    actualDepth: 2,
    actualHeight: 0.55,
  },
  {
    id: 'demo-desk',
    name: '책상 (샘플)',
    category: '책상',
    price: 99000,
    width: 1.2,
    depth: 0.6,
    height: 0.74,
    color: '#C7A77B',
    demo: true, actualWidth: 1.4,
    actualDepth: 2,
    actualHeight: 0.55,
  },
  {
    id: 'demo-wardrobe',
    name: '옷장 (샘플)',
    category: '옷장',
    price: 179000,
    width: 0.9,
    depth: 0.55,
    height: 1.9,
    color: '#E5DED2',
    demo: true, actualWidth: 1.4,
    actualDepth: 2,
    actualHeight: 0.55,
  },
  {
    id: 'demo-table',
    name: '테이블 (샘플)',
    category: '테이블',
    price: 79000,
    width: 0.8,
    depth: 0.8,
    height: 0.72,
    color: '#B78E67',
    demo: true, actualWidth: 1.4,
    actualDepth: 2,
    actualHeight: 0.55,
  },
]

const COLORS = [
  '#D6C5AD',
  '#8EA49A',
  '#C7A77B',
  '#E5DED2',
  '#B78E67',
  '#9CA9C4',
]


function findValue(
  row: Record<string, string>,
  candidates: string[],
): string {
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')

  const candidateKeys = new Set(candidates.map(normalize))
  const key = Object.keys(row).find((original) =>
    candidateKeys.has(normalize(original)),
  )

  return key ? String(row[key] ?? '').trim() : ''
}


function parseNumber(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const number = Number(cleaned)
  return Number.isFinite(number) && number > 0 ? number : null
}

function parsePrice(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[^\d.]/g, '')
  const number = Number(cleaned)
  return Number.isFinite(number) && number >= 0 ? number : null
}


function parseDimension(
  row: Record<string, string>,
  candidates: string[],
): number | null {
  const value = parseNumber(findValue(row, candidates))
  if (value === null) return null

  // 이 CSV의 치수 열은 cm 단위로 기록되어 있음.
  return value / 100
}


function readProducts(rows: Record<string, string>[]): Product[] {
  return rows
    .map((row, index) => {
      const name = findValue(row, [
        'name',
        'productname',
        'product',
        'title',
        'product_name',
        '제품명',
        '상품명',
      ])

      if (!name) return null

      const category =
        findValue(row, [
          'category',
          'categoryname',
          'type',
          '카테고리',
          '분류',
        ]) || '기타'

      const rawPrice = findValue(row, [
        'price',
        'currentprice',
        'productprice',
        '가격',
      ])


      const actualWidth = parseDimension(
        row,
        ['width', 'productwidth', '너비', '가로'],
      )
      const actualDepth = parseDimension(
        row,
        ['depth', 'productdepth', '깊이'],
      )
      const actualHeight = parseDimension(
        row,
        ['height', 'productheight', '높이'],
      )

      // 실제 치수가 없는 경우에만 3D 미리보기용 임시 크기를 사용한다.
      const width = actualWidth ?? 1
      const depth = actualDepth ?? 0.6
      const height = actualHeight ?? 0.75


      return {
        id: `csv-${index}`,
        name,
        category,
        price: parsePrice(rawPrice),
        width: Math.min(width, 4),
        depth: Math.min(depth, 4),
        height: Math.min(height, 3),
        actualWidth,
        actualDepth,
        actualHeight,
        color: COLORS[index % COLORS.length],
      }
    })
    .filter((product): product is Product => product !== null)
}

function formatWon(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`
}

function FurnitureMesh({
  item,
  selected,
  onSelect,
}: {
  item: PlacedFurniture
  selected: boolean
  onSelect: () => void
}) {
  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <mesh
        position={[0, item.height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[item.width, item.height, item.depth]} />
        <meshStandardMaterial
          color={selected ? '#8DAA91' : item.color}
          roughness={0.82}
        />
      </mesh>

      {selected && (
        <mesh position={[0, item.height + 0.025, 0]}>
          <boxGeometry
            args={[item.width + 0.08, 0.035, item.depth + 0.08]}
          />
          <meshBasicMaterial color="#356B48" wireframe />
        </mesh>
      )}
    </group>
  )
}

function Room3D({
  width,
  depth,
  furniture,
  selectedId,
  onSelect,
}: {
  width: number
  depth: number
  furniture: PlacedFurniture[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <Canvas
      shadows
      camera={{
        position: [width * 1.15, Math.max(width, depth) * 0.95, depth * 1.3],
        fov: 42,
      }}
    >
      <color attach="background" args={['#f3f2ee']} />
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.035, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#d9cbb7" />
      </mesh>

      {/* 낮은 벽으로 방의 형태를 알아보기 쉽게 표시 */}
      <mesh position={[0, 0.55, -depth / 2]}>
        <boxGeometry args={[width, 1.1, 0.08]} />
        <meshStandardMaterial color="#f5f3ef" />
      </mesh>
      <mesh position={[-width / 2, 0.55, 0]}>
        <boxGeometry args={[0.08, 1.1, depth]} />
        <meshStandardMaterial color="#ebe8e1" />
      </mesh>
      <mesh position={[width / 2, 0.55, 0]}>
        <boxGeometry args={[0.08, 1.1, depth]} />
        <meshStandardMaterial color="#ebe8e1" />
      </mesh>
      <mesh position={[0, 0.55, depth / 2]}>
        <boxGeometry args={[width, 1.1, 0.08]} />
        <meshStandardMaterial color="#f5f3ef" />
      </mesh>

      <Grid
        position={[0, 0.005, 0]}
        args={[width, depth]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#9a958b"
        sectionSize={1}
        sectionColor="#8c877e"
        fadeDistance={Math.max(width, depth) * 2}
        infiniteGrid={false}
      />

      {furniture.map((item) => (
        <FurnitureMesh
          key={item.instanceId}
          item={item}
          selected={item.instanceId === selectedId}
          onSelect={() => onSelect(item.instanceId)}
        />
      ))}

      <OrbitControls
        makeDefault
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.02}
      />
    </Canvas>
  )
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [csvStatus, setCsvStatus] = useState('IKEA 데이터를 불러오는 중...')
  const [roomWidth, setRoomWidth] = useState(4)
  const [roomDepth, setRoomDepth] = useState(3)
  const [view, setView] = useState<'3d' | 'plan'>('3d')
  const [category, setCategory] = useState('전체')
  const [search, setSearch] = useState('')
  const [furniture, setFurniture] = useState<PlacedFurniture[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCsv() {
      try {
        const response = await fetch('/ikea.csv')
        if (!response.ok) {
          throw new Error(`CSV 요청 실패: ${response.status}`)
        }

        const csvText = await response.text()
        const result = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: '',
        })

        const parsed = readProducts(result.data)

        if (!cancelled && parsed.length > 0) {
          setProducts(parsed)
          setCsvStatus(`${parsed.length.toLocaleString()}개 데이터 불러옴`)
        } else if (!cancelled) {
          setProducts(DEMO_PRODUCTS)
          setCsvStatus('CSV의 상품명 열을 찾지 못해 샘플 데이터를 표시합니다.')
        }
      } catch {
        if (!cancelled) {
          setProducts(DEMO_PRODUCTS)
          setCsvStatus('CSV를 읽지 못해 샘플 데이터를 표시합니다.')
        }
      }
    }

    loadCsv()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(
    () => ['전체', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === '전체' || product.category === category
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [products, category, search])

  const selectedFurniture = furniture.find(
    (item) => item.instanceId === selectedId,
  )

  const total = furniture.reduce(
    (sum, item) => sum + (item.price ?? 0),
    0,
  )
  const unknownPriceCount = furniture.filter(
    (item) => item.price === null,
  ).length

  function addFurniture(product: Product) {
    const instanceId = `${product.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`

    const offset = furniture.length % 4
    const item: PlacedFurniture = {
      ...product,
      instanceId,
      x: Math.max(
        -roomWidth / 2 + product.width / 2,
        Math.min(roomWidth / 2 - product.width / 2, -roomWidth / 4 + offset * 0.35),
      ),
      z: Math.max(
        -roomDepth / 2 + product.depth / 2,
        Math.min(roomDepth / 2 - product.depth / 2, -roomDepth / 4 + offset * 0.35),
      ),
      rotation: 0,
    }

    setFurniture((current) => [...current, item])
    setSelectedId(instanceId)
  }

  function updateSelected(patch: Partial<PlacedFurniture>) {
    setFurniture((current) =>
      current.map((item) =>
        item.instanceId === selectedId ? { ...item, ...patch } : item,
      ),
    )
  }

  function removeSelected() {
    setFurniture((current) =>
      current.filter((item) => item.instanceId !== selectedId),
    )
    setSelectedId(null)
  }

  function changeRoomSize(width: number, depth: number) {
    setRoomWidth(width)
    setRoomDepth(depth)

    setFurniture((current) =>
      current.map((item) => ({
        ...item,
        x: Math.max(
          -width / 2 + item.width / 2,
          Math.min(width / 2 - item.width / 2, item.x),
        ),
        z: Math.max(
          -depth / 2 + item.depth / 2,
          Math.min(depth / 2 - item.depth / 2, item.z),
        ),
      })),
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="roomlab 홈">
          <span className="brand-mark">r.</span>
          <span>roomlab</span>
        </a>
        <span className="topbar-note">나만의 공간을 설계하다</span>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">YOUR SPACE, YOUR STYLE</p>
          <h1>나만의 공간 만들기</h1>
          <p className="subtitle">
            공간 크기를 설정하고 가구를 배치해 나만의 인테리어를 계획해 보세요.
          </p>
        </div>
        <div className="room-size-badge">
          <span>공간 면적</span>
          <strong>{(roomWidth * roomDepth).toFixed(1)}㎡</strong>
        </div>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <section className="panel">
            <div className="panel-title">
              <span className="step-number">01</span>
              <h2>공간 설정</h2>
            </div>

            <div className="dimension-grid">
              <label>
                가로 (m)
                <input
                  type="number"
                  min="2"
                  max="12"
                  step="0.5"
                  value={roomWidth}
                  onChange={(event) =>
                    changeRoomSize(
                      Math.min(12, Math.max(2, Number(event.target.value) || 2)),
                      roomDepth,
                    )
                  }
                />
              </label>
              <label>
                세로 (m)
                <input
                  type="number"
                  min="2"
                  max="12"
                  step="0.5"
                  value={roomDepth}
                  onChange={(event) =>
                    changeRoomSize(
                      roomWidth,
                      Math.min(12, Math.max(2, Number(event.target.value) || 2)),
                    )
                  }
                />
              </label>
            </div>

            <p className="helper-text">
              현재는 직사각형 방을 기준으로 배치합니다.
            </p>
          </section>

          <section className="panel catalog-panel">
            <div className="panel-title">
              <span className="step-number">02</span>
              <h2>가구 선택</h2>
            </div>
            <p className="helper-text">{csvStatus}</p>

            <input
              className="search-input"
              type="search"
              placeholder="가구 이름 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="category-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="가구 카테고리"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="catalog-list">
              {filteredProducts.slice(0, 80).map((product) => (
                <article className="product-row" key={product.id}>
                  <div
                    className="product-swatch"
                    style={{ backgroundColor: product.color }}
                  >
                    <span>{product.category.slice(0, 1)}</span>
                  </div>
                  <div className="product-info">
                    <strong title={product.name}>{product.name}</strong>
                    <span>
                      {product.price === null
                        ? '가격 정보 없음'
                        : formatWon(product.price)}
                    </span>
                    <small>

                      {product.actualWidth !== null && product.actualDepth !== null
                        ? `${product.actualWidth.toFixed(2)} × ${product.actualDepth.toFixed(2)} m`
                        : '치수 정보 없음'}

                    </small>
                  </div>
                  <button
                    className="add-button"
                    onClick={() => addFurniture(product)}
                    aria-label={`${product.name} 추가`}
                    title="공간에 추가"
                  >
                    +
                  </button>
                </article>
              ))}

              {filteredProducts.length === 0 && (
                <p className="empty-state">검색 결과가 없습니다.</p>
              )}
            </div>
          </section>
        </aside>

        <section className="design-area">
          <div className="design-toolbar">
            <div>
              <span className="canvas-label">MY ROOM</span>
              <h2>공간 미리보기</h2>
            </div>
            <div className="view-switch" role="group" aria-label="공간 보기">
              <button
                className={view === '3d' ? 'active' : ''}
                onClick={() => setView('3d')}
              >
                3D 뷰
              </button>
              <button
                className={view === 'plan' ? 'active' : ''}
                onClick={() => setView('plan')}
              >
                평면도
              </button>
            </div>
          </div>

          <div className="room-canvas">
            {view === '3d' ? (
              <Room3D
                width={roomWidth}
                depth={roomDepth}
                furniture={furniture}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="plan-stage">
                <div
                  className="floor-plan"
                  style={{
                    aspectRatio: `${roomWidth} / ${roomDepth}`,
                    maxWidth: roomWidth >= roomDepth ? '100%' : '72%',
                  }}
                >
                  {furniture.map((item) => {
                    const left =
                      ((item.x + roomWidth / 2 - item.width / 2) / roomWidth) *
                      100
                    const top =
                      ((item.z + roomDepth / 2 - item.depth / 2) / roomDepth) *
                      100
                    const selected = item.instanceId === selectedId

                    return (
                      <button
                        key={item.instanceId}
                        className={`plan-furniture ${selected ? 'selected' : ''}`}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${(item.width / roomWidth) * 100}%`,
                          height: `${(item.depth / roomDepth) * 100}%`,
                          backgroundColor: item.color,
                          transform: `rotate(${item.rotation}deg)`,
                        }}
                        onClick={() => setSelectedId(item.instanceId)}
                        title={item.name}
                      >
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="plan-caption">
                  위에서 내려다본 배치도 · {roomWidth}m × {roomDepth}m
                </p>
              </div>
            )}
          </div>

          <div className="canvas-footer">
            <span>
              <span className="status-dot" /> {furniture.length}개 가구 배치됨
            </span>
            <span>방 크기 {roomWidth}m × {roomDepth}m</span>
          </div>

          <section className="panel selected-panel">
            <div className="panel-title">
              <span className="step-number">03</span>
              <h2>선택한 가구</h2>
            </div>

            {selectedFurniture ? (
              <>
                <div className="selected-product-heading">
                  <div>
                    <strong>{selectedFurniture.name}</strong>
                    <p className="helper-text">
                      {selectedFurniture.width.toFixed(2)}m ×{' '}
                      {selectedFurniture.depth.toFixed(2)}m ×{' '}
                      {selectedFurniture.height.toFixed(2)}m
                    </p>
                  </div>
                  <strong className="selected-price">
                    {selectedFurniture.price === null
                      ? '가격 정보 없음'
                      : formatWon(selectedFurniture.price)}
                  </strong>
                </div>

                <div className="dimension-grid furniture-controls">
                  <label>
                    가로 위치 (m)
                    <input
                      type="number"
                      min={-roomWidth / 2}
                      max={roomWidth / 2}
                      step="0.1"
                      value={Number(selectedFurniture.x.toFixed(2))}
                      onChange={(event) =>
                        updateSelected({
                          x: Math.max(
                            -roomWidth / 2 + selectedFurniture.width / 2,
                            Math.min(
                              roomWidth / 2 - selectedFurniture.width / 2,
                              Number(event.target.value) || 0,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    세로 위치 (m)
                    <input
                      type="number"
                      min={-roomDepth / 2}
                      max={roomDepth / 2}
                      step="0.1"
                      value={Number(selectedFurniture.z.toFixed(2))}
                      onChange={(event) =>
                        updateSelected({
                          z: Math.max(
                            -roomDepth / 2 + selectedFurniture.depth / 2,
                            Math.min(
                              roomDepth / 2 - selectedFurniture.depth / 2,
                              Number(event.target.value) || 0,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="selected-actions">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      updateSelected({
                        rotation: (selectedFurniture.rotation + 90) % 360,
                      })
                    }
                  >
                    ↻ 90° 회전
                  </button>
                  <button className="danger-button" onClick={removeSelected}>
                    가구 삭제
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-state">
                가구를 추가한 뒤 3D 공간이나 평면도에서 선택해 보세요.
              </p>
            )}
          </section>
        </section>

        <aside className="summary-sidebar">
          <section className="budget-card">
            <span className="budget-eyebrow">ESTIMATED BUDGET</span>
            <h2>가구 예산</h2>
            <strong className="budget-total">{formatWon(total)}</strong>
            <p>
              배치한 가구 {furniture.length}개 기준
            </p>
            {unknownPriceCount > 0 && (
              <p className="budget-warning">
                가격 미등록 {unknownPriceCount}개는 합계에서 제외됩니다.
              </p>
            )}
          </section>

          <section className="panel">
            <div className="panel-title">
              <h2>배치한 가구</h2>
              <span className="count-badge">{furniture.length}</span>
            </div>

            {furniture.length === 0 ? (
              <p className="empty-state">
                왼쪽 가구 목록에서 + 버튼을 눌러 추가해 보세요.
              </p>
            ) : (
              <div className="placed-list">
                {furniture.map((item) => (
                  <button
                    key={item.instanceId}
                    className={`placed-item ${selectedId === item.instanceId ? 'selected' : ''
                      }`}
                    onClick={() => setSelectedId(item.instanceId)}
                  >
                    <span
                      className="placed-swatch"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="placed-name">{item.name}</span>
                    <span className="placed-price">
                      {item.price === null ? '—' : formatWon(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {furniture.length > 0 && (
              <button
                className="clear-button"
                onClick={() => {
                  setFurniture([])
                  setSelectedId(null)
                }}
              >
                전체 가구 비우기
              </button>
            )}
          </section>

          <section className="next-step-card">
            <span className="next-step-icon">⌂</span>
            <h3>다음 목표</h3>
            <p>
              공간 설계를 완성한 뒤, 면적과 예산에 맞는 실제 부동산 매물을
              연결할 예정이에요.
            </p>
            <span className="coming-soon">부동산 연동은 다음 단계</span>
          </section>
        </aside>
      </div>

      <footer className="app-footer">
        roomlab · 공간과 가구 예산을 계획하는 첫 번째 버전
      </footer>
    </main>
  )
}
