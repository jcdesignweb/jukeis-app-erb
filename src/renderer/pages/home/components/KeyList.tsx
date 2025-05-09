import React, { useState, useMemo } from 'react';
import { List, Typography, Input, Button, Space, Select, Modal } from 'antd';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { t } from 'i18next';
import { Group } from '../../../../main/models';
import { deleteItemModal } from '../../../utils/modal-delete-item';
import { useDataContext } from '../../../contexts/DataContext';

const KeyList: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<
    string | undefined
  >(undefined);
  const [visibleKeys, setVisibleKeys] = useState<{ [keyId: string]: boolean }>(
    {},
  );

  const [modal, contextHolder] = Modal.useModal();

  const { state, refresh } = useDataContext();

  const filteredKeysByDescription = useMemo(() => {
    if (!filter) {
      return state.keys;
    }
    return state.keys.filter((key) =>
      key.description.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [state.keys, filter]);

  const filteredKeysByGroup = useMemo(() => {
    if (!selectedGroupFilter) {
      return filteredKeysByDescription;
    }
    return filteredKeysByDescription.filter(
      (key) => key.groupId === selectedGroupFilter,
    );
  }, [filteredKeysByDescription, selectedGroupFilter]);

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleDeleteItem = async (keyId: string) => {
    deleteItemModal(modal, async () => {
      await window.electron.ipcRenderer.invoke('delete-key', keyId);
      refresh();
    });
  };

  const handleGroupFilterChange = (value: string | undefined) => {
    setSelectedGroupFilter(value);
  };

  const uniqueGroups = useMemo(() => {
    return state.groups.reduce((acc: Group[], curr: Group) => {
      if (!acc.find((group) => group.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);
  }, [state.groups]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexDirection: 'row',
        }}
      >
        <Input
          placeholder={t('home.filter-by-origin')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder={t('home.filter-by-group')}
          onChange={handleGroupFilterChange}
          value={selectedGroupFilter}
          style={{ width: 200 }}
        >
          <Select.Option value={undefined}>
            {t('home.all-groups')}
          </Select.Option>
          {uniqueGroups.map((group) => (
            <Select.Option key={group.id} value={group.id}>
              {group.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {contextHolder}

      <List
        dataSource={filteredKeysByGroup}
        renderItem={(item) => (
          <List.Item key={item.id}>
            <Space
              direction="horizontal"
              size="middle"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Typography.Text strong>
                  {item.description} (
                  {state.groups.find((g) => g.id === item.groupId)?.name ||
                    t('home.no-group')}
                  ):
                </Typography.Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography.Text code>
                  {visibleKeys[item.id] ? item.key : '••••••••'}
                </Typography.Text>
                <Button
                  icon={
                    visibleKeys[item.id] ? (
                      <EyeOutlined />
                    ) : (
                      <EyeInvisibleOutlined />
                    )
                  }
                  size="small"
                  onClick={() => toggleVisibility(item.id)}
                  style={{ marginLeft: 8 }}
                />
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => handleCopy(item.key)}
                  style={{ marginLeft: 8 }}
                />
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ marginLeft: 8 }}
                />
              </div>
            </Space>
          </List.Item>
        )}
        split
      />
    </>
  );
};

export default KeyList;
