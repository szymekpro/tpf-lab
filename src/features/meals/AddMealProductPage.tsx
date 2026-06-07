import { useMemo, useState } from 'react';
import { Icon } from '../../components';
import { PRODUCTS } from './MealsTypes';
import type { Product } from './MealsTypes';
import './AddMealProductPage.css';

type ProductFilter = 'all' | 'dishes' | 'favorites';

type Props = {
  mealName: string;
  onBack: () => void;
  onSave: (products: Product[]) => void;
};

export default function AddMealProductPage({
  mealName,
  onBack,
  onSave,
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProductFilter>('all');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pl-PL');

    return PRODUCTS.filter((product) => {
      const matchesQuery = product.name
        .toLocaleLowerCase('pl-PL')
        .includes(normalizedQuery);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'dishes' && product.category === 'dish') ||
        (filter === 'favorites' && product.favorite === true);

      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  const frequentlySelected = filteredProducts.filter(
    (product) => product.frequent,
  );

  const recentlyAdded = filteredProducts.filter(
    (product) => product.recent || !product.frequent,
  );

  function addProduct(product: Product) {
    setSelectedProducts((current) => {
      const isAlreadySelected = current.some(
        (selectedProduct) => selectedProduct.id === product.id,
      );

      if (isAlreadySelected) {
        return current;
      }

      return [...current, product];
    });
  }

  function removeProduct(productId: string) {
    setSelectedProducts((current) =>
      current.filter((product) => product.id !== productId),
    );
  }

  function handleSave() {
    if (selectedProducts.length === 0) {
      return;
    }

    onSave(selectedProducts);
  }

  return (
    <section className="add-product">
      <header className="add-product__heading">
        <button
          className="add-product__back"
          type="button"
          onClick={onBack}
          aria-label="Wróć do listy posiłków"
        >
          ←
        </button>

        <div>
          <h1>Dodaj produkt</h1>
          <p>{mealName}</p>
        </div>
      </header>

      <label className="add-product__search">
        <Icon name="search" size={21} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj produktu..."
        />
      </label>

      <div className="add-product__filters" aria-label="Filtry produktów">
        <button
          type="button"
          className={`add-product__filter ${
            filter === 'all' ? 'add-product__filter--active' : ''
          }`}
          onClick={() => setFilter('all')}
        >
          Wszystko
        </button>

        <button
          type="button"
          className={`add-product__filter ${
            filter === 'dishes' ? 'add-product__filter--active' : ''
          }`}
          onClick={() => setFilter('dishes')}
        >
          Dania
        </button>

        <button
          type="button"
          className={`add-product__filter ${
            filter === 'favorites' ? 'add-product__filter--active' : ''
          }`}
          onClick={() => setFilter('favorites')}
        >
          Ulubione
        </button>
      </div>

      {selectedProducts.length > 0 && (
        <section className="add-product__selected">
          <h2>Wybrane produkty</h2>

          <div className="add-product__selected-list">
            {selectedProducts.map((product) => (
              <div className="add-product__selected-row" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>
                    {product.portion} · {product.calories} kcal
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  aria-label={`Usuń produkt: ${product.name}`}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            className="add-product__save"
            type="button"
            onClick={handleSave}
          >
            Zapisz posiłek ({selectedProducts.length})
          </button>
        </section>
      )}

      {frequentlySelected.length > 0 && (
        <section className="add-product__section">
          <h2>Często wybierane</h2>

          <div className="add-product__frequent-grid">
            {frequentlySelected.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProducts.some(
                  (selectedProduct) => selectedProduct.id === product.id,
                )}
                onAdd={() => addProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {recentlyAdded.length > 0 && (
        <section className="add-product__section">
          <h2>Produkty</h2>

          <div className="add-product__product-list">
            {recentlyAdded.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                isSelected={selectedProducts.some(
                  (selectedProduct) => selectedProduct.id === product.id,
                )}
                onAdd={() => addProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredProducts.length === 0 && (
        <div className="add-product__empty">
          Nie znaleziono produktu pasującego do wyszukiwania.
        </div>
      )}
    </section>
  );
}

type ProductCardProps = {
  product: Product;
  isSelected: boolean;
  onAdd: () => void;
};

function ProductCard({
  product,
  isSelected,
  onAdd,
}: ProductCardProps) {
  return (
    <article className="add-product__frequent-card">
      <div>
        <span className="add-product__eyebrow">
          {product.category === 'fruit' ? 'Owoce' : 'Produkt'}
        </span>

        <h3>{product.name}</h3>
        <p>{product.portion}</p>

        <strong>{product.calories} kcal</strong>
      </div>

      <button
        type="button"
        className={`add-product__plus ${
          isSelected ? 'add-product__plus--selected' : ''
        }`}
        onClick={onAdd}
        disabled={isSelected}
        aria-label={`Dodaj produkt: ${product.name}`}
      >
        <Icon name="plus" size={20} />
      </button>
    </article>
  );
}

type ProductRowProps = {
  product: Product;
  isSelected: boolean;
  onAdd: () => void;
};

function ProductRow({
  product,
  isSelected,
  onAdd,
}: ProductRowProps) {
  return (
    <article className="add-product__product-row">
      <div className="add-product__product-icon">
        <Icon name="fork" size={18} />
      </div>

      <div className="add-product__product-info">
        <strong>{product.name}</strong>

        <small>{product.portion}</small>

        <div className="add-product__badges">
          <span>{product.ww.toFixed(1)} WW</span>
          <span>{product.wbt.toFixed(1)} WBT</span>
        </div>
      </div>

      <span className="add-product__product-calories">
        {product.calories} kcal
      </span>

      <button
        type="button"
        className={`add-product__row-plus ${
          isSelected ? 'add-product__row-plus--selected' : ''
        }`}
        onClick={onAdd}
        disabled={isSelected}
        aria-label={`Dodaj produkt: ${product.name}`}
      >
        <Icon name="plus" size={18} />
      </button>
    </article>
  );
}