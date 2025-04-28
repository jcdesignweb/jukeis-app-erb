import { Button, Input, List, Modal, Space, Typography } from 'antd';
import { t } from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { useDataContext } from '../../../contexts/DataContext';
import { deleteItemModal } from '../../../utils/modal-delete-item';

const GroupList: React.FC = () => {
  const [filter, setFilter] = useState('');
  const { state, refresh } = useDataContext();
  const [modal, contextHolder] = Modal.useModal();

  const filteredGroups = useMemo(() => {
    if (!filter) {
      return state.groups;
    }
    return state.groups.filter((group) =>
      group.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [state, filter]);

  const handleDeleteItem = async (keyId: string) => {
    deleteItemModal(modal, async () => {
      await window.electron.ipcRenderer.invoke('delete-group', keyId);
      refresh();
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div id="group-list">
      <Input
        placeholder={t('groups.filterBy')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {contextHolder}
      <List
        dataSource={filteredGroups}
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
                <Typography.Text strong>{item.name}</Typography.Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
      />
    </div>
  );
};

export default GroupList;
