<template>
  <div>
    <div class="form-wrap">
      <label>
        <span>姓名：</span>
        <input v-model="form.name" type="text" />
      </label>
      <label>
        <span>性别：</span>
        <select v-model="form.sex">
          <option value="1">男</option>
          <option value="2">女</option>
        </select>
      </label>
      <label>
        <span>年龄：</span>
        <input v-model="form.age" type="number" />
      </label>
      <label>
        <span>签名：</span>
        <input v-model="form.autograph" />
      </label>
      <button @click="createHandle">创建</button>
      <button @click="editSaveHandle" v-if="form.id">保存修改</button>
    </div>
    <div class="search-wrap">
      <input type="search" />
      <button @click="getList">搜索</button>
    </div>
    <div class="list-wrap">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>性别</th>
            <th>年龄</th>
            <th>签名</th>
            <th>创建时间</th>
            <th>修改时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in list" :key="v.id">
            <td>{{ v.name }}</td>
            <td>{{ formatSex(v.sex) }}</td>
            <td>{{ v.age }}</td>
            <td>{{ v.autograph }}</td>
            <td>{{ new Date(v.createAt) }}</td>
            <td>{{ new Date(v.updateAt) }}</td>
            <td>
              <button @click="editHandle(v)">修改</button>
              <button @click="deleteHandle(v)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import GDb from "../../plugins/db";

const db = new GDb({
  projectId: "1392",
  filePath: "db.json",
  privateToken: "VDzv_dgzsorpjpTysKvy",
  baseURL: "http://gitlab.sensorsdata.cn/api/v4/",
  userName: "lvyueyang",
  indexing: ["name"],
});
export default {
  name: "App",
  data() {
    return {
      search: {},
      list: [],
      form: {
        name: "",
        sex: "1",
        age: "",
        autograph: "",
      },
    };
  },
  mounted() {
    this.getUserInfo();
    this.getList();
  },
  methods: {
    getList() {
      db.query()
        .then((res) => {
          this.list = res;
        })
        .catch((e) => {
          alert(e.message);
        });
    },
    createHandle() {
      const { name, sex, age, autograph } = this.form;
      db.create({
        name,
        sex,
        age,
        autograph,
      })
        .then((res) => {
          this.getList();
          alert("创建成功");
        })
        .catch((e) => {
          alert(e.message);
        });
    },
    editHandle(item) {
      const { id, name, sex, age, autograph } = item;
      this.form.id = id;
      this.form.name = name;
      this.form.sex = sex;
      this.form.age = age;
      this.form.autograph = autograph;
    },
    editSaveHandle() {
      const { name, sex, age, autograph } = this.form;
      db.update(this.form.id, {
        name,
        sex,
        age,
        autograph,
      })
        .then((res) => {
          this.getList();
          alert("修改成功");
        })
        .catch((e) => {
          alert(e.message);
        });
    },
    deleteHandle(v) {
      if (!confirm(`确定要删除 ${v.name} 吗？`)) return;
      db.delete(v.id)
        .then((res) => {
          this.getList();
          alert("删除成功");
        })
        .catch((e) => {
          alert(e.message);
        });
    },
    formatSex(sex) {
      return {
        1: "男",
        2: "女",
      }[sex];
    },
    getUserInfo() {
      db.http.get("/user");
    },
  },
};
</script>
<style lang="less">
.form-wrap,
.search-wrap {
  margin-bottom: 10px;
  border: 1px solid #ccc;
  padding: 15px 10px;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  margin-top: 15px;
}

td,
th {
  padding: 10px 15px;
  border: 1px solid #ccc;
}
</style>