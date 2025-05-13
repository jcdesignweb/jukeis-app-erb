import {
  Button,
  Divider,
  Form,
  Input,
  InputRef,
  Modal,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { t } from 'i18next';
import { v4 as uuidv4 } from 'uuid';
import { PlusOutlined } from '@ant-design/icons';
import { Group } from '../../../../../main/models';
import { useDataContext } from '../../../../contexts/DataContext';
import { Channels } from '../../../../../main/ipc/channels';

export type AddKeyModalProps = {
  isModalOpen: boolean;
  groups: Group[];
  onComplete: (status: boolean) => void;
};

interface FormAddNewValues {
  key: string;
  password: string;
  groupId: string;
}

export const AddKeyModal: React.FC<AddKeyModalProps> = ({
  isModalOpen,
  groups,
  onComplete,
}) => {
  const { refresh } = useDataContext();

  const [groupName, setGroupName] = useState('');

  const inputRef = useRef<InputRef>(null);

  const [form] = Form.useForm();

  const handleSubmit = async (values: FormAddNewValues) => {
    try {
      await window.electron.ipcRenderer.sendNewKey({
        description: values.key,
        key: values.password,
        id: uuidv4(),
        groupId: values.groupId,
        ts: Date.now().toString(),
      });

      onComplete(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOkModal = () => {
    form.submit();
  };

  useEffect(() => {
    if (!isModalOpen) {
      form.resetFields();
    }
  }, [isModalOpen, form]);

  const addGroupItem = async (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();

    const newGroup: Group = {
      id: uuidv4(),
      name: groupName,
      ts: Date.now().toString(),
    };

    try {
      const groups = await window.electron.ipcRenderer.invoke<Group[]>(
        Channels.ADD_GROUP,
        newGroup,
      );

      if (groups) {
        refresh();
        setGroupName('');
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (e) {
      console.error('e', e);
    }
  };

  const onGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGroupName(event.target.value);
  };

  return (
    <Modal
      title={t('modal.creator.title')}
      open={isModalOpen}
      onOk={handleOkModal}
      onCancel={() => onComplete(false)}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={{ layout: 'verical' }}
      >
        <Form.Item
          label={t('modal.creator.origin')}
          name="key"
          style={{ width: '100%' }}
          rules={[
            { required: true, message: t('modal.creator.origin-required') },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('modal.creator.password')}
          name="password"
          style={{ width: '100%' }}
          rules={[
            { required: true, message: t('modal.creator.password-required') },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('modal.creator.group')}
          name="groupId"
          rules={[]}
          style={{ width: '100%' }}
        >
          <Select
            style={{ width: 300 }}
            placeholder={t('modal.creator.select-placeholder')}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Input
                    placeholder={t('modal.creator.select-add-item')}
                    ref={inputRef}
                    value={groupName}
                    onChange={onGroupNameChange}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={addGroupItem}
                  >
                    {t('create')}
                  </Button>
                </Space>
              </>
            )}
            options={groups.map((group) => ({
              label: group.name,
              value: group.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
