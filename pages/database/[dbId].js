import React, { useState, useEffect, useReducer } from 'react';
import Nav from '../../src/components/Nav/Nav';
import MainGround from '../../src/components/MainGround/MainGround';
import RightSideBar from '../../src/components/RightSidebar/RightSidebar';
import LeftSideBar from '../../src/components/LeftSidebar/LeftSidebar';
import CreateTableModal from '../../src/components/CreateTableModal/CreateTableModal';
import { useRouter } from 'next/router';
import '../../src/utils/Types';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { useIdb } from '../../src/utils/customHooks/useIndexDb';
import { useRadio } from '../../src/utils/customHooks/useRadio';
import { code } from '../../src/utils/helper-function/createCode';
import { EXPLORERCONSTANT } from '../../src/utils/constant/explorer';
import {
  defaultRightSidebarState,
  rightSidebarReducer,
} from '../../src/utils/reducers/AppReducer';
import cloneDeep from 'clone-deep';
const parser = require('js-sql-parser');

export default function Database() {
  //right sidebar state
  const [state, dispatch] = useReducer(
    rightSidebarReducer,
    defaultRightSidebarState,
  );
  const {
    selectedTable,
    showCheckConstraint,
    selectedCheckConstraintName,
    showUniqueConstraint,
    selectedUniqueConstraintName,
    showPrimaryConstraint,
    selectedPrimaryConstraintName,
    showForeignConstraint,
    selectedForeignConstraintName,
    showAttribute,
    selectedAttributeName,
  } = state;
  const [tempConstraintName, setTempConstraintName] = useState('');
  const [
    tempCheckConstraintExpression,
    setTempCheckConstraintExpression,
  ] = useState({});
  const [tempMultiSelect, setTempMultiSelect] = useState([]);
  const [tempSingleSelect, setTempSingleSelect] = useState({});
  const [referencingTable, setReferencingTable] = useState({});
  const [referencingAtt, setReferencingAtt] = useState({});
  const [checkedItem, setCheckedItem] = useState({});
  const [sizeInputValue, setSizeInputValue] = useState('');
  const [preInputValue, setPreInputValue] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  //app state
  const [showGrid, toggleShowGrid] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showModal, updateShowModal] = useState(false);
  const [showLeftSidebar, toogleLeftSidebar] = useState(true);
  const router = useRouter();
  const { dbId } = router.query;
  const [radioArray, setRadioArray, , setInitialRadioArray] = useRadio();
  /**
   *@type {[databaseType,Function]} database
   */
  const [database, setDatabase] = useIdb(
    { databaseName: '', mainTableDetails: [], tableDndDetails: [] },
    dbId,
  );

  /**
   * @param {tableDndDetailsObj[]} newTableDndDetails
   */

  function tableDndDetailsHandler(newTableDndDetails) {
    const newDatabase = cloneDeep(database);
    newDatabase.modifiedAt = new Date();
    newDatabase.tableDndDetails = newTableDndDetails;
    setDatabase(newDatabase);
  }

  function newTableCreatedHandler() {
    updateShowModal(true);
  }
  function cancelCreateTableModalHandler() {
    updateShowModal(false);
  }

  function mainTableDetailsChangeHandler(newMainTableDetails) {
    const newDatabase = cloneDeep(database);
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
  }

  /**
   * @param {tableDndDetailsObj} newTable
   * @param {mainTableDetailsType} newMainTableDetail
   */
  function confirmCreateTableModalHandler(newTable, newMainTableDetail) {
    updateShowModal(false);
    const newDetails = [...database.mainTableDetails, newMainTableDetail];
    const newDndDetails = [...database.tableDndDetails, newTable];
    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.tableDndDetails = newDndDetails;
    newDatabase.mainTableDetails = newDetails;
    setDatabase(newDatabase);
  }

  function cleanupRightSidebar() {
    dispatch({ type: 'DEFAULT_STATE' });
    setShowRightSidebar(false);
    setTempConstraintName('');
    setTempCheckConstraintExpression('');
    setTempMultiSelect([]);
    setTempSingleSelect({});
    setReferencingTable({});
    setReferencingAtt({});
    setCheckedItem({});
    setPreInputValue('');
    setSizeInputValue('');
    setDefaultValue('');
  }

  /**
   *
   * @param {mainTableDetailsType} table
   * @param {string} type
   * @param {object} itemObj
   */
  function explorerItemClickHandler(table, type, itemObj) {
    dispatch({ type: 'CLOSE_PREVIOUS_BLOCK' });
    switch (type) {
      case EXPLORERCONSTANT.CHECK: {
        dispatch({
          type: 'CHECKCONSTRAINT_CONTAINER_SHOW',
          payload: { table, name: itemObj.constraintName },
        });
        setTempConstraintName(itemObj.constraintName);
        const str = parser.stringify(itemObj.AST).split('WHERE')[1];
        setTempCheckConstraintExpression(str.substring(2, str.length - 1));
        setShowRightSidebar(true);
        break;
      }
      case EXPLORERCONSTANT.UNIQUE: {
        const selectedOptions = [];
        const uniqueIndex = table.tableLevelConstraint.UNIQUETABLELEVEL.findIndex(
          (uniqObj) => uniqObj.constraintName === itemObj.constraintName,
        );
        table.tableLevelConstraint.UNIQUETABLELEVEL[
          uniqueIndex
        ].attributes.forEach((uid) => {
          const index = table.attributes.findIndex(
            (attrObj) => attrObj.id === uid,
          );
          selectedOptions.push({
            label: table.attributes[index].name,
            value: uid,
          });
        });
        dispatch({
          type: 'UNIQUECONSTRAINT_CONTAINER_SHOW',
          payload: { table, name: itemObj.constraintName },
        });
        setTempConstraintName(itemObj.constraintName);
        setTempMultiSelect(selectedOptions);
        setShowRightSidebar(true);
        break;
      }
      case EXPLORERCONSTANT.PRIMARY: {
        const selectedOptions = [];
        table.tableLevelConstraint.PRIMARYKEY.attributes.forEach((uid) => {
          const index = table.attributes.findIndex(
            (attrObj) => attrObj.id === uid,
          );
          selectedOptions.push({
            label: table.attributes[index].name,
            value: uid,
          });
        });
        dispatch({
          type: 'PRIMARYCONSTRAINT_CONTAINER_SHOW',
          payload: { table, name: itemObj.constraintName },
        });
        setTempConstraintName(itemObj.constraintName);
        setTempMultiSelect(selectedOptions);
        setShowRightSidebar(true);
        break;
      }
      case EXPLORERCONSTANT.FOREIGN: {
        dispatch({
          type: 'FOREIGNCONSTRAINT_CONTAINER_SHOW',
          payload: { table, name: itemObj.constraintName },
        });

        const referencedAttIndex = table.attributes.findIndex(
          (attrObj) => attrObj.id === itemObj.referencedAtt,
        );
        const referencingTableIndex = database.mainTableDetails.findIndex(
          (table) => table.id === itemObj.ReferencingTable,
        );
        const referencingAttIndex = database.mainTableDetails[
          referencingTableIndex
        ].attributes.findIndex(
          (attrObj) => attrObj.id === itemObj.ReferencingAtt,
        );

        setTempSingleSelect({
          label: table.attributes[referencedAttIndex].name,
          value: itemObj.referencedAtt,
        });

        setReferencingTable({
          label: database.mainTableDetails[referencingTableIndex].tableName,
          value: itemObj.ReferencingTable,
        });

        setReferencingAtt({
          label:
            database.mainTableDetails[referencingTableIndex].attributes[
              referencingAttIndex
            ].name,
          value: itemObj.ReferencingAtt,
        });
        const radio = [];
        if (itemObj.cascade) {
          radio.push({ label: 'CASCADE', value: 'CASCADE', checked: true });
          radio.push({ label: 'SET NULL', value: 'SET-NULL' });
        } else {
          radio.push({ label: 'CASCADE', value: 'CASCADE' });
          if (itemObj.setNull) {
            radio.push({ label: 'SET NULL', value: 'SET-NULL', checked: true });
          } else {
            radio.push({ label: 'SET NULL', value: 'SET-NULL' });
          }
        }
        setInitialRadioArray(radio);
        setTempConstraintName(itemObj.constraintName);
        setShowRightSidebar(true);
        break;
      }
      case EXPLORERCONSTANT.ATTRIBUTE: {
        const tempConstraint = {};
        if (itemObj.isNOTNULL) {
          tempConstraint['NOT-NULL'] = true;
        }
        if (itemObj.isUNIQUE) {
          tempConstraint['UNIQUE'] = true;
        }
        if (itemObj.isAUTOINCREMENT) {
          tempConstraint['AUTO-INCREMENT'] = true;
        }
        if (itemObj.DEFAULT) {
          tempConstraint['DEFAULT'] = true;
          setDefaultValue(itemObj.DEFAULT);
        }
        dispatch({
          type: 'ATTRIBUTE_SHOW',
          payload: { table, name: itemObj.name },
        });
        if (itemObj.size) {
          setSizeInputValue(itemObj.size);
        }
        if (itemObj.precision) {
          setPreInputValue(itemObj.precision);
        }
        setTempSingleSelect({
          label: itemObj.dataType,
          value: itemObj.dataType,
        });
        setTempConstraintName(itemObj.name);
        setShowRightSidebar(true);
        setCheckedItem(tempConstraint);
        break;
      }
      default: {
        return;
      }
    }
  }

  function rightSideBarAfterConfirmOrDelete(newMainTableDetails) {
    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
    cleanupRightSidebar();
  }

  function confirmUniqueConstraintClickHandler() {
    let finalConstraintName;
    if (tempConstraintName.length === 0) {
      finalConstraintName = selectedUniqueConstraintName;
    } else {
      finalConstraintName = tempConstraintName;
    }
    const newMainTableDetails = cloneDeep(database.mainTableDetails);

    const tableIndex = newMainTableDetails.findIndex(
      (table) => table.id === selectedTable.id,
    );

    const constraintIndex = newMainTableDetails[
      tableIndex
    ].tableLevelConstraint?.UNIQUETABLELEVEL.findIndex((uniqueObj) => {
      return uniqueObj.constraintName === selectedUniqueConstraintName;
    });

    newMainTableDetails[tableIndex].tableLevelConstraint.UNIQUETABLELEVEL[
      constraintIndex
    ] = {
      constraintName: finalConstraintName,
      attributes: tempMultiSelect.map((item) => item.value),
    };

    newMainTableDetails[tableIndex].attributes.forEach((attrObj) => {
      const index = attrObj.inTableLevelUniquConstraint.findIndex(
        (unique) => unique === selectedUniqueConstraintName,
      );
      if (index > -1) {
        attrObj.inTableLevelUniquConstraint.splice(index, 1);
      }
      const hasIndex = tempMultiSelect
        .map((item) => item.value)
        .findIndex((uid) => uid === attrObj.id);
      if (hasIndex > -1) {
        attrObj.inTableLevelUniquConstraint.push(finalConstraintName);
      }
    });
    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
    cleanupRightSidebar();
  }

  function confirmPrimaryConstraintClickHandler() {
    let finalConstraintName;
    if (tempConstraintName.length === 0) {
      finalConstraintName = selectedUniqueConstraintName;
    } else {
      finalConstraintName = tempConstraintName;
    }
    const newMainTableDetails = cloneDeep(database.mainTableDetails);

    const tableIndex = newMainTableDetails.findIndex(
      (table) => table.id === selectedTable.id,
    );

    newMainTableDetails[tableIndex].tableLevelConstraint.PRIMARYKEY = {
      constraintName: finalConstraintName,
      attributes: tempMultiSelect.map((item) => item.value),
    };

    newMainTableDetails[tableIndex].attributes.forEach((attrObj) => {
      const hasIndex = tempMultiSelect
        .map((item) => item.value)
        .findIndex((uid) => uid === attrObj.id);
      if (hasIndex > -1) {
        attrObj['isPRIMARYKEY'] = true;
      } else {
        delete attrObj.isPRIMARYKEY;
      }
    });

    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
    cleanupRightSidebar();
  }

  function deleteUniqueConstraintClickHandler() {
    const newMainTableDetails = cloneDeep(database.mainTableDetails);
    const tableIndex = newMainTableDetails.findIndex(
      (table) => table.id === selectedTable.id,
    );

    const constraintIndex = newMainTableDetails[
      tableIndex
    ].tableLevelConstraint?.UNIQUETABLELEVEL.findIndex((uniqueObj) => {
      return uniqueObj.constraintName === selectedCheckConstraintName;
    });

    newMainTableDetails[
      tableIndex
    ].tableLevelConstraint.UNIQUETABLELEVEL.splice(constraintIndex, 1);
    newMainTableDetails[tableIndex].attributes.forEach((attrObj) => {
      attrObj.inTableLevelUniquConstraint = attrObj.inTableLevelUniquConstraint.filter(
        (unique) => {
          return unique !== selectedUniqueConstraintName;
        },
      );
    });
    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
    cleanupRightSidebar();
  }

  function deletePrimaryConstraintClickHandler() {
    const newMainTableDetails = cloneDeep(database.mainTableDetails);
    const tableIndex = newMainTableDetails.findIndex(
      (table) => table.id === selectedTable.id,
    );
    newMainTableDetails[tableIndex].tableLevelConstraint.PRIMARYKEY = null;
    newMainTableDetails[tableIndex].attributes.forEach((attrObj) => {
      delete attrObj.isPRIMARYKEY;
    });
    const newDatabase = { ...database };
    newDatabase.modifiedAt = new Date();
    newDatabase.mainTableDetails = newMainTableDetails;
    setDatabase(newDatabase);
    cleanupRightSidebar();
  }

  function showGridHandler() {
    toggleShowGrid((prevShowGrid) => !prevShowGrid);
  }

  function showRightSidebarHandler() {
    setShowRightSidebar((prevshowRightSidebar) => !prevshowRightSidebar);
  }

  function showLeftSidebarHandler() {
    toogleLeftSidebar((prevShowLeftSidebar) => !prevShowLeftSidebar);
  }

  function pdf() {
    window.print();
  }

  useEffect(() => {
    function shortcutHandler(e) {
      // ctrl + b (explorer sidebar toggle)
      if (!e.altKey && e.which === 66 && e.ctrlKey && !e.shiftKey) {
        showLeftSidebarHandler();
      }
      // alt + g (grid toggle)
      else if (e.altKey && e.which === 71 && !e.shiftKey && !e.ctrlKey) {
        showGridHandler();
      }
      //alt + t (new table)
      else if (!e.ctrlKey && e.which === 84 && e.altKey && !e.shiftKey) {
        newTableCreatedHandler();
      }
      // alt + c (get code)
      else if (!e.ctrlKey && e.which === 67 && e.altKey && !e.shiftKey) {
        code(database.mainTableDetails);
      }
    }
    document.addEventListener('keyup', shortcutHandler);
    return () => {
      document.removeEventListener('keyup', shortcutHandler);
    };
  }, [database.mainTableDetails]);
  return (
    <>
      <Nav
        showGrid={showGrid}
        showRightSidebar={showRightSidebar}
        showLeftSidebar={showLeftSidebar}
        onGridClick={showGridHandler}
        onCreateTableClick={newTableCreatedHandler}
        onRightSideBarClick={showRightSidebarHandler}
        onLeftSideBarClick={showLeftSidebarHandler}
        Main={MainGround}
        mainTableDetails={database.mainTableDetails}
        tableDndDetails={database.tableDndDetails}
      />
      {showModal && (
        <CreateTableModal
          showModalState={showModal}
          allMainTableDetails={database.mainTableDetails}
          onModalClosed={cancelCreateTableModalHandler}
          onModalConfirmed={confirmCreateTableModalHandler}
        />
      )}
      <ContextMenuTrigger id='same_unique_identifier' holdToDisplay={-1}>
        <div className='App'>
          {showLeftSidebar && (
            <LeftSideBar
              mainTableDetails={database.mainTableDetails}
              toggleSidebar={showLeftSidebarHandler}
              onItemClicked={explorerItemClickHandler}
              onMainTableDetailsChange={mainTableDetailsChangeHandler}
              onCreateTableButtonClick={newTableCreatedHandler}
            />
          )}
          <MainGround
            showGrid={showGrid}
            mainTableDetails={database.mainTableDetails}
            tableDndDetails={database.tableDndDetails}
            onMainTableDetailsChange={mainTableDetailsChangeHandler}
            onTableDndDetailsChange={tableDndDetailsHandler}
            onRowClicked={explorerItemClickHandler}
            onForeignArrowClicked={explorerItemClickHandler}
          />
          {showRightSidebar && (
            <RightSideBar
              mainTableDetails={database.mainTableDetails}
              toggleSidebar={showRightSidebarHandler}
              onCancel={cleanupRightSidebar}
              table={selectedTable}
              showCheckConstraint={showCheckConstraint}
              constraintName={tempConstraintName}
              checkExpr={tempCheckConstraintExpression}
              onConstraintNameChange={setTempConstraintName}
              onCheckExprChange={setTempCheckConstraintExpression}
              initialCheckConstraintName={selectedCheckConstraintName}
              showUniqueConstraint={showUniqueConstraint}
              initialUniqueConstraintName={selectedUniqueConstraintName}
              selectedMultipleSelect={tempMultiSelect}
              onMultipleSelectChange={setTempMultiSelect}
              onDeleteUniqueConstraint={deleteUniqueConstraintClickHandler}
              onConfirmUniqueConstraintClick={
                confirmUniqueConstraintClickHandler
              }
              showPrimaryConstraint={showPrimaryConstraint}
              initialPrimaryConstraintName={selectedPrimaryConstraintName}
              onDeletePrimaryConstraint={deletePrimaryConstraintClickHandler}
              onConfirmPrimaryConstraintClick={
                confirmPrimaryConstraintClickHandler
              }
              singleSelect={tempSingleSelect}
              referencingTable={referencingTable}
              referencingAtt={referencingAtt}
              initialForeignConstraintName={selectedForeignConstraintName}
              showForeignConstraint={showForeignConstraint}
              onSingleSelectChange={setTempSingleSelect}
              onReferencingAttChange={setReferencingAtt}
              onReferencingTableChange={setReferencingTable}
              checkedItem={checkedItem}
              onCheckedItemChange={setCheckedItem}
              showAttribute={showAttribute}
              initialAttributeName={selectedAttributeName}
              sizeInput={sizeInputValue}
              preInput={preInputValue}
              onSizeInputChange={setSizeInputValue}
              onPreInputChange={setPreInputValue}
              defaultValue={defaultValue}
              onDefaultValueChange={setDefaultValue}
              onRightSideBarAfterConfirmOrDelete={
                rightSideBarAfterConfirmOrDelete
              }
              foreignRadio={radioArray}
              onForeignRadioChange={setRadioArray}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenu id='same_unique_identifier' className={'menu'}>
        <MenuItem onClick={newTableCreatedHandler} className={'menuItem'}>
          Add table <span className={'shrotcut'}>alt + t</span>
        </MenuItem>
        <MenuItem onClick={showGridHandler} className={'menuItem'}>
          {showGrid ? 'hide grid' : 'show grid'}{' '}
          <span className={'shrotcut'}>alt + g</span>
        </MenuItem>
        <MenuItem
          onClick={() => code(database.mainTableDetails)}
          className={'menuItem'}>
          export as code
          <span className={'shrotcut'}>alt + c</span>
        </MenuItem>
        <MenuItem onClick={showLeftSidebarHandler} className={'menuItem'}>
          {showLeftSidebar ? 'hide sidebar' : 'show sidebar'}
          <span className={'shrotcut'}>ctrl + b</span>
        </MenuItem>
        <MenuItem onClick={pdf} className={'menuItem'}>
          export as pdf
          <span className={'shrotcut'}>ctrl + p</span>
        </MenuItem>
      </ContextMenu>
    </>
  );
}
