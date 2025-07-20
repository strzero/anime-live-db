'use client';
import { useState, useMemo } from 'react';
import ShowTable, { Show } from '@/components/ShowTable';
import ShowDetailDialog from '@/components/ShowDetailDialog';
import showsData from '@/data/data.json';
import { getOfficialVenueName, stripVenueAddress } from '@/components/venueUtils';
import { isMiscOrHidden } from '@/components/miscFilterUtils';
import { fuzzyMatch } from '@/components/fuzzyMatch';

export default function ShowsPage() {
  const [searchText, setSearchText] = useState('');
  const [selectedNats, setSelectedNats] = useState<string[]>(['日本']); // 默认日本
  const [selectedDate, setSelectedDate] = useState('');
  const [hideChanged, setHideChanged] = useState(true);
  const [openShow, setOpenShow] = useState<any>(null);
  // 新的国籍分组
  const NATION_LIST = ['中国', '日本', '俄罗斯', '英美', '其他'];
  // 国籍归类函数
  function mapNation(nat: string) {
    if (nat === '中国') return '中国';
    if (nat === '日本') return '日本';
    if (nat === '俄罗斯') return '俄罗斯';
    if (nat === '英国' || nat === '美国') return '英美';
    return '其他';
  }

  const filteredShows = useMemo<Show[]>(() => {
    return (showsData as Show[]).filter(show => {
      if (
        searchText &&
        !(
          fuzzyMatch(show.演出名称, searchText) ||
          fuzzyMatch(show.演出场所 || '', searchText) ||
          fuzzyMatch(show.举办单位 || '', searchText)
        )
      ) return false;
      if (selectedNats.length > 0) {
        const actorNats = show.出演者名单?.map(a => mapNation(a.国籍)) || [];
        if (!actorNats.some(n => selectedNats.includes(n))) return false;
      }
      if (selectedDate && !show.演出日期数据?.includes(selectedDate)) return false;
      if (hideChanged && show.许可事项类型 !== '新办') return false;
      if (hideChanged && isMiscOrHidden(show)) return false;
      return true;
    });
  }, [searchText, selectedNats, selectedDate, hideChanged]);

  // 计算最新审批时间
  const latestApprovalTime = filteredShows.reduce((latest, show) => {
    return show.审批时间 > latest ? show.审批时间 : latest;
  }, '');

  return (
    <div>
      <h1>演出列表</h1>
      <div className="filter-bar" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filter-row search-row" style={{ flex: 1, minWidth: 200 }}>
          <input
            placeholder="搜索演出名称..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
          />
        </div>
        <div className="filter-row nation-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 200 }}>
          {NATION_LIST.map(nat => (
            <label key={nat} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={selectedNats.includes(nat)}
                onChange={() => {
                  setSelectedNats(prev =>
                    prev.includes(nat) ? prev.filter(x => x !== nat) : [...prev, nat]
                  );
                }}
                style={{ accentColor: '#1976d2' }}
              />
              {nat}
            </label>
          ))}
        </div>
        <div className="filter-row date-row" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={hideChanged}
              onChange={e => setHideChanged(e.target.checked)}
              style={{ accentColor: '#1976d2' }}
            />
            隐藏变更与杂项
          </label>
        </div>
      </div>
      <ShowTable shows={filteredShows} hideChanged={hideChanged} />
      {openShow && <ShowDetailDialog show={openShow} onClose={() => setOpenShow(null)} />}
    </div>
  );
}
