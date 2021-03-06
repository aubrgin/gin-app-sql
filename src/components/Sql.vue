<template>
  <div class="sql-app">
    <SqlMenu
      :schemas="schemas"
      :tables="tables"
      @resize="menuWidth=$event"
      @tableClick="tableClick"
    />
    <div class="sql-container">
      <div class="sql-toolbar">
        <button
          @click="executeQuery"
          class="sql-tool"
        >
          Execute
        </button>
        <button
          class="sql-tool"
          @click="openConfig"
        >
          Config
        </button>
        <button
          class="sql-tool"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>
      <div class="sql-interface">
        <textarea
          v-model="query"
          class="sql-editor"
        />
        <SqlTable :value="data" />
        <SqlForm
          v-if="modalOpen"
          :fields="fields"
          :value="config"
          @submit="submit"
        />
        <div class="sql-history">
          <div
            v-for="(element, index) in history"
            class="sql-history-item"
            @click="changeQuery(element.query, index)"
          >
            <div v-if="element.draft">
              Draft query:
            </div>
            <div v-else>
              Query returned {{ element.length }} rows.
            </div>
            <pre> {{ element.query }} </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Client } from 'pg';
import SqlTable from './SqlTable.vue';
import SqlMenu from './SqlMenu.vue';
import SqlForm from './SqlForm.vue';
import ginFs from '@aubrgin/gin-fs';

export default {
  name: 'Sql',
  components: {
    SqlTable,
    SqlMenu,
    SqlForm,
  },
  data() {
    return {
      query: 'SELECT NOW();',
      config: {},
      data: {},
      schemas: [],
      fields: [],
      history: [],
      tables: {},
      modalOpen: false,
      menuWidth: 100,
      executed: false,
      submit() {
        // leave empty
      },
    };
  },
  watch: {
    query() {
      this.executed = false;
    },
  },
  created() {
    this.config = ginFs.getConfig('config', 'sql');
    this.syncStructure();
  },
  methods: {
    openConfig() {
      if (this.modalOpen) {
        this.modalOpen = false;
        return;
      }
      this.modalOpen = true;
      this.fields = [
        'host',
        'user',
        'password',
        'database',
        'port',
      ];
      this.submit = (event) => {
        this.config = event;
        ginFs.setConfig('config', this.config, 'sql');
        this.modalOpen = false;
        this.syncStructure();
      };
    },
    tableClick(table, schema) {
      this.query = `SELECT * FROM ${schema}.${table} LIMIT 10;`;
      this.executeQuery();
    },
    async syncStructure() {
      let result = await this.execute('SELECT nspname FROM pg_catalog.pg_namespace;');
      this.schemas = result.rows.map((row) => row.nspname);
      result = await this.execute('SELECT schemaname, tablename FROM pg_catalog.pg_tables;');
      this.tables = {};
      result.rows.forEach((row) => {
        if (!(row.schemaname in this.tables)) this.tables[row.schemaname] = [];
        this.tables[row.schemaname].push(row.tablename);
      });
    },
    changeQuery(query, index) {
      this.history.splice(index, 1);
      if (!this.executed) this.history.splice(0, 0, { draft: true, query: this.query });
      this.query = query;
    },
    async execute(query) {
      let rtn;
      const client = new Client(this.config);
      try {
        await client.connect();
        rtn = await client.query(query);
      } catch (e) {
        rtn = e;
      } finally {
        client.end();
      }
      return rtn;
    },
    async executeQuery() {
      this.data = await this.execute(this.query);
      this.executed = true;
      this.history.splice(0, 0, { query: this.query, length: (this.data && this.data.rows && this.data.rows.length) || 0 });
    },
  },
};
</script>

<style>
 .sql-app {
     display: flex;
   background-color: var(--color-background);
     height: 100%;
 }
 .sql-editor {
     width: 100%;
     resize: none;
 }
 .sql-data-table {
     width: 100%;
     overflow: scroll;
 }
 .sql-interface {
     padding: 16px;
     width: 100%;
 }
 .sql-container {
     flex-grow: 1;
     overflow: hidden;
 }
 .sql-toolbar{
     height: 64px;
     width: 100%;
     background-color: var(--color-background-alternate);
     padding: 8px;
     box-sizing: border-box;
   white-space: nowrap;

 }

 .sql-tool {
     height: 48px;
   width: 64px;
     background-color: var(--color-alternate);
     box-sizing: border-box;
     padding: auto;
     color: white;
     display: inline-block;
     border: none;
   margin-right: 8px;
 }
 .sql-tool:hover {
   background-color: var(--color-active);
 }
 .sql-history-item {
     color: white;
     background-color: var(--color-primary);
     padding: 4px;
     margin: 4px;
 }

 .sql-history {
   position: absolute;
   overflow-y: auto;
   bottom: 0;
   height: 300px;
   width: 100%;
 }
</style>
