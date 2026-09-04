import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { INVENTORY_TYPES, type InventoryItem } from '@clinixa/shared';
import { getInventory, updateInventoryItem } from '../../lib/api/inventory';
import { useAuthStore } from '../../lib/store/authStore';
import { hasPermission } from '../../lib/permissions';
import { AddInventoryItemModal } from './AddInventoryItemModal';
import { EditInventoryItemModal } from './EditInventoryItemModal';
import { AdjustQtyModal } from './AdjustQtyModal';

/** المخزون — Screen موديول المخزون. `GET /api/inventory` بيرجّع مصفوفة واحدة بدون Pagination — فلترة الاسم محلية بالكامل. */
export function InventoryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const permissions = useAuthStore((s) => s.employee?.permissions);
  const canAdd = hasPermission(permissions, 'inv.add');
  const canEdit = hasPermission(permissions, 'inv.edit');

  const [filter, setFilter] = useState('');
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!openRowMenu) return;
    const close = () => setOpenRowMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openRowMenu]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory(),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateInventoryItem(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const allItems = inventoryQuery.data?.ok ? inventoryQuery.data.data.items : [];
  const items = filter.trim()
    ? allItems.filter((item) => item.name_ar.includes(filter.trim()) || item.name_en?.toLowerCase().includes(filter.trim().toLowerCase()))
    : allItems;
  const isLoading = inventoryQuery.isLoading;
  const isEmpty = !isLoading && items.length === 0;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }

  function handleCreated() {
    setShowAddModal(false);
    invalidate();
    setToast(t('inventory.toasts.created'));
  }

  function handleUpdated() {
    setEditItem(null);
    invalidate();
    setToast(t('inventory.toasts.updated'));
  }

  function handleAdjusted() {
    setAdjustItem(null);
    invalidate();
    setToast(t('inventory.toasts.qtyAdjusted'));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t('shell.nav.inventory')}</h1>
          <p className="page-sub">{t('inventory.headCount', { count: allItems.length })}</p>
        </div>
        {canAdd && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary btn-inline" onClick={() => setShowAddModal(true)}>
              <svg width={18} height={18} aria-hidden="true"><use href="#i-plus" /></svg>
              <span>{t('inventory.addItem')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="table-card glass">
        <div className="card-toolbar">
          <div className={`filter-field${filter ? ' active' : ''}`}>
            <span className="lead-icon"><svg width={18} height={18} aria-hidden="true"><use href="#i-list-filter" /></svg></span>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('inventory.filterPlaceholder')}
              aria-label={t('inventory.filterPlaceholder')}
            />
            {filter && (
              <button type="button" className="filter-clear" onClick={() => setFilter('')} aria-label={t('common.clearFilter')}>
                <svg width={16} height={16} aria-hidden="true"><use href="#i-x" /></svg>
              </button>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg width={24} height={24}><use href="#i-package" /></svg>
            </div>
            <h2 className="empty-title">{t('inventory.emptyTitle')}</h2>
            <p className="empty-text">{t('inventory.emptyText')}</p>
          </div>
        ) : (
          <table className="data-table" aria-label={t('shell.nav.inventory')}>
            <thead>
              <tr>
                <th scope="col" className="c-name">{t('inventory.columns.item')}</th>
                <th scope="col">{t('inventory.columns.type')}</th>
                <th scope="col" className="c-age">{t('inventory.columns.qty')}</th>
                <th scope="col" className="c-age">{t('inventory.columns.minQty')}</th>
                <th scope="col">{t('inventory.columns.unit')}</th>
                <th scope="col" className="c-status">{t('inventory.columns.status')}</th>
                <th scope="col" className="c-act"><span className="sr-only">{t('common.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="c-name"><span className="skel" style={{ width: '70%' }} /></td>
                      <td><span className="skel" style={{ width: '60%' }} /></td>
                      <td className="c-age"><span className="skel" style={{ width: '40%', margin: '0 auto' }} /></td>
                      <td className="c-age"><span className="skel" style={{ width: '40%', margin: '0 auto' }} /></td>
                      <td><span className="skel" style={{ width: '50%' }} /></td>
                      <td className="c-status"><span className="skel" style={{ width: '60%', margin: '0 auto' }} /></td>
                      <td className="c-act" />
                    </tr>
                  ))
                : items.map((item) => (
                    <tr key={item.id}>
                      <td className="c-name">
                        <span className="txt">
                          <span style={{ display: 'block', fontWeight: 600 }}>{item.name_ar}</span>
                          {item.name_en && <span className="meta" style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--color-text-secondary)' }}>{item.name_en}</span>}
                        </span>
                      </td>
                      <td>{INVENTORY_TYPES.find((it) => it.key === item.type)?.label_ar ?? item.type}</td>
                      <td className="c-age num">
                        <span className={item.low_stock ? 'due-amount' : undefined}>{item.qty}</span>
                      </td>
                      <td className="c-age num">{item.min_qty ?? '—'}</td>
                      <td>{item.unit}</td>
                      <td className="c-status">
                        {!item.is_active ? (
                          <span className="badge badge-muted">{t('inventory.statusInactive')}</span>
                        ) : item.low_stock ? (
                          <span className="badge badge-warning">{t('inventory.lowStock')}</span>
                        ) : (
                          <span className="badge badge-success">{t('inventory.statusActive')}</span>
                        )}
                      </td>
                      <td className="c-act">
                        <div className="menu-wrap">
                          <button
                            type="button"
                            className="row-menu-btn"
                            aria-haspopup="true"
                            aria-expanded={openRowMenu === item.id}
                            aria-label={t('common.actions')}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenRowMenu((prev) => (prev === item.id ? null : item.id));
                            }}
                          >
                            <svg width={18} height={18} aria-hidden="true"><use href="#i-more" /></svg>
                          </button>
                          <div className={`dropdown compact up${openRowMenu === item.id ? ' open' : ''}`} role="menu">
                            {canEdit && (
                              <button type="button" className="menu-item" role="menuitem" onClick={() => { setAdjustItem(item); setOpenRowMenu(null); }}>
                                <svg width={18} height={18} aria-hidden="true"><use href="#i-package" /></svg>
                                <span>{t('inventory.adjustQty')}</span>
                              </button>
                            )}
                            {canEdit && (
                              <button type="button" className="menu-item" role="menuitem" onClick={() => { setEditItem(item); setOpenRowMenu(null); }}>
                                <svg width={18} height={18} aria-hidden="true"><use href="#i-file-pen" /></svg>
                                <span>{t('inventory.edit')}</span>
                              </button>
                            )}
                            {canEdit && (
                              <button
                                type="button"
                                className="menu-item danger"
                                role="menuitem"
                                onClick={() => { toggleActiveMutation.mutate({ id: item.id, is_active: !item.is_active }); setOpenRowMenu(null); }}
                              >
                                <svg width={18} height={18} aria-hidden="true"><use href={item.is_active ? '#i-x' : '#i-check'} /></svg>
                                <span>{item.is_active ? t('inventory.deactivate') : t('inventory.activate')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddInventoryItemModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
      {editItem && <EditInventoryItemModal item={editItem} onClose={() => setEditItem(null)} onUpdated={handleUpdated} />}
      {adjustItem && <AdjustQtyModal item={adjustItem} onClose={() => setAdjustItem(null)} onAdjusted={handleAdjusted} />}

      <div className={`ok-toast${toast ? ' on' : ''}`} role="status">
        <svg width={18} height={18} aria-hidden="true"><use href="#i-check-circle" /></svg>
        <span>{toast}</span>
      </div>
    </>
  );
}
