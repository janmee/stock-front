import {
  createJob,
  deleteJob,
  interruptJob,
  listJob,
  modifyJob,
  pauseJob,
  resumeJob, runJob
} from '@/services/ant-design-pro/api';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProTable,
} from '@ant-design/pro-components';
import {FormattedMessage, useIntl} from '@umijs/max';
import {Button, Input, message} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import type {FormValueType} from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import {PlusOutlined} from "@ant-design/icons";

/**
 * @en-US International configuration
 * @zh-CN 国际化配置
 * */
const TableList: React.FC = () => {
  // International configuration
  const intl = useIntl();

  /**
   * @en-US Pop-up window of new window
   * @zh-CN 新建窗口的弹窗
   *  */
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  /**
   * @en-US The pop-up window of the distribution update window
   * @zh-CN 分布更新窗口的弹窗
   * */
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();

  useEffect(() => {
    const localServer = "localhost:8080";
    const remoteServer = "124.220.36.95:8080";
    const server = process.env.NODE_ENV == 'production' ? remoteServer : localServer;
    const webSocket = new WebSocket(`ws://${server}/webSocket/job`);

    webSocket.onmessage = (message: any) => {
      const data = "" + message.data;
      if (data.startsWith("任务执行完成")) {
        console.log("任务执行完成,刷新任务状态")
        // debugger
        actionRef.current?.reload();
      }
    }
    return () => webSocket.close();
  }, []);


  const columns: ProColumns<API.RuleListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.jobId"
          defaultMessage="Rule name"
        />
      ),
      dataIndex: 'sort',
      hideInSearch: true,
    },

    {
      title: <FormattedMessage id="pages.searchTable.jobName" defaultMessage="Description"/>,
      dataIndex: 'name',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.searchTable.jobClassName" defaultMessage="Description"/>,
      dataIndex: 'className',
      valueType: 'textarea',
      render: (dom, entity, index) => {
        let split = entity?.className.split(".");
        let lastPart = split[split.length - 1];
        return (
          <span>
              {`**.*.${lastPart}`}
          </span>)
      }
    },
    {
      title: <FormattedMessage id="pages.searchTable.jobDescription" defaultMessage="Description"/>,
      dataIndex: 'description',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.jobTimeZone" defaultMessage="Time Zone"/>,
      dataIndex: 'timeZone',
      valueType: 'select',
      hideInSearch: true,
      valueEnum: {
        'Asia/Shanghai': { 
          text: <FormattedMessage id="pages.job.timeZone.shanghai" defaultMessage="Beijing (CST)" /> 
        },
        'America/New_York': { 
          text: <FormattedMessage id="pages.job.timeZone.newyork" defaultMessage="Eastern US (EDT/EST)" /> 
        },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.jobCronExpression" defaultMessage="Description"/>,
      dataIndex: 'cron',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.searchTable.createTime" defaultMessage="Description"/>,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: (
        <FormattedMessage id="pages.searchTable.updateTime" defaultMessage="Last updateTime"/>
      ),
      sorter: true,
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      renderFormItem: (item, {defaultRender, ...rest}, form) => {
        const status = form.getFieldValue('status');
        if (`${status}` === '0') {
          return false;
        }
        if (`${status}` === '3') {
          return (
            <Input
              {...rest}
              placeholder={intl.formatMessage({
                id: 'pages.searchTable.exception',
                defaultMessage: 'Please enter the reason for the exception!',
              })}
            />
          );
        }
        return defaultRender(item);
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.jobStatus" defaultMessage="Status"/>,
      dataIndex: 'status',
      hideInForm: true,
      order: 1,
      sorter: true,
      valueEnum: (a) => {
        return a?.running == '1' ? {
            0: {
              text: <FormattedMessage id="pages.job.status.running" defaultMessage="Running" />,
              status: 'Processing',
            },
            1: {
              text: <FormattedMessage id="pages.job.status.running" defaultMessage="Running" />,
              status: 'Processing',
            }
          } :
          {
            1: {
              text: <FormattedMessage id="pages.searchTable.jobStatus.running" defaultMessage="Scheduling" />,
              status: 'Success',
            },
            0: {
              text: <FormattedMessage id="pages.searchTable.jobStatus.paused" defaultMessage="Paused" />,
              status: 'Default',
            }
          }
      },
    },
    {
      title: '相关操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a key="k1"
           onClick={async () => {
             if (record.running == "1") {
               await handleInterrupt(record)
             } else {
               await handleRun(record)
             }
             actionRef?.current?.reload();
           }}
        >
          <FormattedMessage id={record.running == '1' ? 'pages.searchTable.interruptJob' : 'pages.searchTable.runJob'} 
                            defaultMessage={record.running == '1' ? 'Interrupt' : 'Trigger'} />
        </a>,
        <a
          key="k2"
          onClick={async (_) => {
            setCurrentRow(record);
            if (record.status == "1") {
              await handlePause(record)
            } else {
              await handleResume(record)
            }
            actionRef?.current?.reload()
          }}
        >
          <FormattedMessage id={record.status == "1" ? "pages.searchTable.stopJob" : "pages.searchTable.startJob"}
                            defaultMessage={record.status == "1" ? "Pause" : "Resume"} />
        </a>,
        <a key="k3"
           onClick={() => {
             setCurrentRow(record)
             handleUpdateModalOpen(true);
           }}
        >
          <FormattedMessage
            id="pages.searchTable.updateJob"
            defaultMessage="Update"
          />
        </a>,
        <a key="k4"
           onClick={async () => {
             setCurrentRow(record);
             await handleRemove(record);
             actionRef?.current?.reload()
           }}
        >
          <FormattedMessage
            id="pages.searchTable.deleteJob"
            defaultMessage="Delete"
          />
        </a>,
      ],
    }
  ];

  const handleAdd = async (fields: API.RuleListItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.creating', defaultMessage: 'Creating job...' }));
    try {
      hide();
      const res = await createJob({data: fields});
      if (res.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.createSuccess', defaultMessage: 'Job created successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.createFailed', defaultMessage: 'Failed to create job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  const handleUpdate = async (fields: FormValueType) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.updating', defaultMessage: 'Updating job...' }));
    try {
      hide();
      let res = await modifyJob({data: fields});
      if (res.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.updateSuccess', defaultMessage: 'Job updated successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.updateFailed', defaultMessage: 'Failed to update job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  const handleRemove = async (fields: FormValueType) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.deleting', defaultMessage: 'Deleting job...' }));
    try {
      hide();
      let res = await deleteJob({data: fields});
      if (res.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.deleteSuccess', defaultMessage: 'Job deleted successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.deleteFailed', defaultMessage: 'Failed to delete job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  const handlePause = async (fields: FormValueType) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.pausing', defaultMessage: 'Pausing job...' }));
    try {
      hide();
      let res = await pauseJob({data: fields});
      if (res.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.pauseSuccess', defaultMessage: 'Job paused successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.pauseFailed', defaultMessage: 'Failed to pause job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  const handleInterrupt = async (fields: FormValueType) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.interrupting', defaultMessage: 'Interrupting job...' }));
    try {
      hide()
      const res = await interruptJob({data: fields});
      if (res?.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.interruptSuccess', defaultMessage: 'Job interrupted successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.interruptFailed', defaultMessage: 'Failed to interrupt job!' }));
      }
    } catch (error) {
      hide()
    }
  };

  const handleResume = async (fields: FormValueType) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.job.message.resuming', defaultMessage: 'Resuming job...' }));
    try {
      hide();
      let res = await resumeJob({data: fields});
      if (res?.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.resumeSuccess', defaultMessage: 'Job resumed successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.resumeFailed', defaultMessage: 'Failed to resume job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  const handleRun = async (fields: FormValueType) => {
    const hide = message.loading(
      intl.formatMessage(
        { id: 'pages.job.message.running', defaultMessage: '{name}, triggering job...' },
        { name: fields.name }
      )
    );
    try {
      hide();
      let res = await runJob({data: fields});
      if (res?.success) {
        message.success(intl.formatMessage({ id: 'pages.job.message.runSuccess', defaultMessage: 'Job triggered successfully!' }));
      } else {
        message.error(intl.formatMessage({ id: 'pages.job.message.runFailed', defaultMessage: 'Failed to trigger job!' }));
      }
    } catch (error) {
      hide();
    }
  };

  return (
    <PageContainer>
      <ProTable<API.RuleListItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          // 新建按钮
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              handleModalOpen(true);
            }}
          >
            <PlusOutlined/> <FormattedMessage id="pages.searchTable.new" defaultMessage="New"/>
          </Button>,
        ]}
        request={listJob}
        columns={columns}
      />
      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.newRule',
          defaultMessage: 'New rule',
        })}
        width="520px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        modalProps={{destroyOnClose: true}}
        onFinish={async (value) => {
          await handleAdd(value as API.RuleListItem);
          handleModalOpen(false);
          actionRef?.current?.reload();
        }}
      >
        <ProFormText width="md" name="id" hidden={true}/>
        <ProFormDigit width="md" name="sort"
                      label={'任务排序'}
                      initialValue={0}
        />
        <ProFormText
          rules={[
            {
              required: true,
              message: '任务名称为必填项',
            },
          ]}
          width="md"
          name="name"
          label={intl.formatMessage({
            id: 'pages.searchTable.jobName',
            defaultMessage: '任务名称',
          })}
        />
        <ProFormTextArea width="md" name="description" label={intl.formatMessage({
          id: 'pages.searchTable.jobDescription',
          defaultMessage: '任务描述',
        })}/>
        <ProFormTextArea width="md" name="className"
                         label={intl.formatMessage({
                           id: 'pages.searchTable.jobClassName',
                           defaultMessage: '任务全类名',
                         })}
                         rules={[
                           {
                             required: true,
                             message: '任务全类名为必填项',
                           }]}/>
        <ProFormSelect
          width="md"
          name="timeZone"
          label="时区"
          initialValue="Asia/Shanghai"
          options={[
            { label: '北京时区 (CST)', value: 'Asia/Shanghai' },
            { label: '美东时区 (EDT/EST)', value: 'America/New_York' },
          ]}
          rules={[
            {
              required: true,
              message: '请选择时区',
            },
          ]}
        />
        <ProFormText width="md" name="cron"
                     label={intl.formatMessage({
                       id: 'pages.searchTable.jobCronExpression',
                       defaultMessage: '执行表达式',
                     })}
                     rules={[
                       {
                         required: true,
                         message: (
                           <FormattedMessage
                             id="pages.modalForm.message.cron"
                             defaultMessage="jobCronExpression is required"
                           />
                         ),
                       }]}
                     initialValue={"0 0 9-15 * * ?"}
        />

      </ModalForm>
      <UpdateForm
        onSubmit={async (value) => {
          await handleUpdate(value);
          handleUpdateModalOpen(false);
          setCurrentRow(undefined);
          actionRef?.current?.reload();
        }}
        onCancel={() => {
          handleUpdateModalOpen(false);
          setCurrentRow(undefined);
        }}
        updateModalOpen={updateModalOpen}
        values={currentRow || {}}
      />
    </PageContainer>
  );
};

export default TableList;
