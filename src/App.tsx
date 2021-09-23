import React, {
  ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BianarySearchTree } from './libs/BST';
import { ReactComponent as ChevronDown } from './assets/icons/chevron-down-solid.svg';
import { useLocalStorage } from './hooks/useLocalStorage';

type Data = {
  id: number;
  name: string;
  date: string;
  title: string;
  field: string;
  old_value: string;
  new_value: string;
};
enum DataKeys {
  Id = 'id',
  Name = 'name',
  Date = 'date',
  Title = 'title',
  Field = 'field',
  OldValue = 'old_value',
  New_value = 'new_value',
}
enum SortType {
  Ascending = 'asc',
  Descending = 'dsc',
}
enum SearchParamKeys {
  Name = 'name',
  Title = 'title',
  Date = 'date',
  Field = 'field',
  SortKey = 'sort_key',
  SortType = 'sort_type',
}

const getData = async () => {
  const res = await fetch('/mocks/data.json');
  const json: Data[] = await res.json();
  return json;
};
const typingDelay = 600;
const tableHeadItems: Array<{ label: string; key: keyof Data }> = [
  { label: 'نام تغییر دهنده', key: 'name' },
  { label: 'تاریخ', key: 'date' },
  { label: 'نام آگهی', key: 'title' },
  { label: 'فیلد', key: 'field' },
  { label: 'مقدار قدیمی', key: 'old_value' },
  { label: 'مقدار جدید', key: 'new_value' },
];

function App() {
  const [allData, setAllData] = useState<Data[]>();
  const [keys, setKeys] = useState<{
    name: string | null;
    date: string | null;
    title: string | null;
    field: string | null;
  }>({
    name: null,
    date: null,
    title: null,
    field: null,
  });
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useRef(new URLSearchParams(window.location.search));
  const [sortKey, setSortKey] = useState<keyof Data>();
  const [sortType, setSortType] = useState<SortType>();
  const [maxRecord, setMaxRecord] = useLocalStorage('max-records', 40);
  const [feturedRecords, setFeaturedRecords] = useLocalStorage<number[]>(
    'fetured-records',
    []
  );

  /* make Binary Search Tree if allData exists */
  const bst = useMemo(() => {
    if (allData) {
      const newBST = new BianarySearchTree<Data>();
      allData.forEach((item) => {
        const value = new Date(item.date).getTime();
        newBST.insert(item, value);
      });
      return newBST;
    }
    return null;
  }, [allData]);

  /* make the actual records which is filtered and sorted */
  const items = useMemo<Data[] | null | undefined>(() => {
    /* start loading untill the process get finished */
    setLoading(true);

    /* if BianarySearchTree or allData has not been set yet, stop the execution */
    if (!bst || !allData) {
      return null;
    }

    /* seperate date filter from other filter keys */
    const { date, ...otherKeys } = keys;

    /* test otherKeys need to be used for filter or not */
    const findOtherKeys = Object.values(otherKeys).find(
      (item) => item !== null && item.trim().length > 0
    );

    let all = allData;

    /* if no filter set yet, return and show no records */
    if ((date === null || date.trim().length === 0) && !findOtherKeys) {
      setLoading(false);
      return null;
    }

    /* if date filter used, use BST algorithm */
    if (date !== null && date.trim().length > 0) {
      all = bst.search(new Date(date.trim()).getTime());
    }

    /* if other filter Keys used, use default Arr.filter method */
    if (findOtherKeys) {
      const { field, title, name } = otherKeys;
      all = all.filter((item) => {
        const newField = (field || '').trim();
        const newTitle = (title || '').trim();
        const newName = (name || '').trim();

        if (newField.length > 0) {
          if (!new RegExp(newField, 'i').test(item.field)) return false;
        }
        if (newTitle.length > 0) {
          if (!new RegExp(newTitle, 'i').test(item.title)) return false;
        }
        if (newName.length > 0) {
          if (!new RegExp(newName, 'i').test(item.name)) return false;
        }

        return true;
      });
    }

    /* if any data left after filter and sortKey exsists, sort them */
    if (all.length > 0 && sortKey !== undefined && sortType !== undefined) {
      all.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return -1;
        if (a[sortKey] > b[sortKey]) return 1;
        return 0;
      });
      if (sortType === SortType.Descending) {
        all.reverse();
      }
    }

    /* stop the loading after all process */
    setLoading(false);

    return all;
  }, [keys, allData, bst, sortKey, sortType]);

  /* get and set allData */
  useEffect(() => {
    getData().then((res) => {
      setAllData(res);
    });
  }, []);

  /* get initial filter and sort */
  useEffect(() => {
    setName(searchParams.current.get(SearchParamKeys.Name) || '');
    setTitle(searchParams.current.get(SearchParamKeys.Title) || '');
    setDate(searchParams.current.get(SearchParamKeys.Date) || '');
    setField(searchParams.current.get(SearchParamKeys.Field) || '');

    let sortKey = searchParams.current.get(SearchParamKeys.SortKey);
    switch (sortKey) {
      case DataKeys.Date:
        setSortKey('date');
        break;
      case DataKeys.Field:
        setSortKey('field');
        break;
      case DataKeys.Name:
        setSortKey('name');
        break;
      case DataKeys.New_value:
        setSortKey('new_value');
        break;
      case DataKeys.OldValue:
        setSortKey('old_value');
        break;
      case DataKeys.Title:
        setSortKey('title');
        break;

      default:
        sortKey = null;
        searchParams.current.delete(SearchParamKeys.SortKey);
        break;
    }

    if (sortKey) {
      const sortType = searchParams.current.get(SearchParamKeys.SortType);
      switch (sortType) {
        case SortType.Ascending:
          setSortType(SortType.Ascending);
          break;
        case SortType.Descending:
          setSortType(SortType.Descending);
          break;

        default:
          setSortType(SortType.Descending);
          break;
      }
    } else {
      searchParams.current.delete(SearchParamKeys.SortType);
    }
  }, []);

  useEffect(() => {
    if (keys.name) {
      searchParams.current.set(SearchParamKeys.Name, keys.name);
    } else {
      searchParams.current.delete(SearchParamKeys.Name);
    }
    if (keys.field) {
      searchParams.current.set(SearchParamKeys.Field, keys.field);
    } else {
      searchParams.current.delete(SearchParamKeys.Field);
    }
    if (keys.date) {
      searchParams.current.set(SearchParamKeys.Date, keys.date);
    } else {
      searchParams.current.delete(SearchParamKeys.Date);
    }
    if (keys.title) {
      searchParams.current.set(SearchParamKeys.Title, keys.title);
    } else {
      searchParams.current.delete(SearchParamKeys.Title);
    }
    if (sortKey) {
      searchParams.current.set(SearchParamKeys.SortKey, sortKey);
    } else {
      searchParams.current.delete(SearchParamKeys.SortKey);
    }
    if (sortType) {
      searchParams.current.set(SearchParamKeys.SortType, sortType);
    } else {
      searchParams.current.delete(SearchParamKeys.SortType);
    }
    window.history.pushState({}, '', `/?${searchParams.current.toString()}`);
  }, [keys, sortKey, sortType]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setKeys({ name, title, field, date });
    }, typingDelay);

    return () => {
      clearTimeout(timeout);
    };
  }, [date, field, name, title]);

  const sortKeyHanlder = (key: keyof Data) => {
    setSortType((value) => {
      if (value === undefined) {
        return SortType.Descending;
      }
      if (sortKey === key) {
        if (value === SortType.Ascending) return SortType.Descending;
        if (value === SortType.Descending) return SortType.Ascending;
      }
      return value;
    });
    setSortKey(key);
  };

  const feturedRecordHandler = (id: Data['id']) => {
    if (!feturedRecords.includes(id))
      return setFeaturedRecords((value) => [...value, id]);
    setFeaturedRecords((value) => value.filter((item) => item !== id));
  };

  const maxRecordChangeHandler: React.InputHTMLAttributes<HTMLInputElement>['onChange'] =
    (e) => {
      const n = +e.target.value;
      if (n > 0) {
        setMaxRecord(n);
      }
    };

  return (
    <div>
      {loading && 'در حال بارگیری...'}

      <Fields
        items={[
          {
            id: 'max-record',
            title: 'تعداد رکورد در صفحه',
            type: 'number',
            onChange: maxRecordChangeHandler,
            value: maxRecord,
          },
        ]}
      />
      <Fields
        items={[
          {
            id: 'name',
            title: 'نام تغییر دهنده',
            type: 'text',
            onChange: (e) => setName(e.target.value),
            value: name,
          },
          {
            id: 'date',
            title: 'تاریخ',
            type: 'text',
            onChange: (e) => setDate(e.target.value),
            value: date,
          },
          {
            id: 'title',
            title: 'نام آگهی',
            type: 'text',
            onChange: (e) => setTitle(e.target.value),
            value: title,
          },
          {
            id: 'field',
            title: 'فیلد',
            type: 'text',
            onChange: (e) => setField(e.target.value),
            value: field,
          },
        ]}
      />
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {tableHeadItems.map(({ key, label }) => (
                <th key={key} onClick={() => sortKeyHanlder(key)}>
                  <div className="sortable-key">
                    {label}
                    {sortKey === key && (
                      <ChevronDown
                        className={`sort-icon ${
                          sortType === SortType.Ascending
                            ? 'sort-icon--reverse'
                            : ''
                        } `}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items && items.length === 0 && (
              <div className="info">هیچ رکوردی یافت نشد</div>
            )}
            {(items || []).slice(0, maxRecord).map((record) => {
              return (
                <tr
                  className={`featured ${
                    feturedRecords.includes(record.id)
                      ? 'featured--active'
                      : 'featured--inactive'
                  }`}
                  key={record.id}
                  onClick={() => feturedRecordHandler(record.id)}>
                  {[
                    record.name,
                    record.date,
                    record.title,
                    record.field,
                    record.old_value,
                    record.new_value,
                  ].map((text) => (
                    <td dir="auto">{text}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Fields = ({
  items,
}: {
  items: Array<
    ComponentProps<'input'> & {
      id: string;
      title: string;
    }
  >;
}) => {
  return (
    <div className="fields">
      {items.map(({ id, title, ...rest }) => (
        <div className="field">
          <label htmlFor={id}>{title}</label>
          <input dir="auto" id={id} name={id} {...rest} />
        </div>
      ))}
    </div>
  );
};

export default App;
