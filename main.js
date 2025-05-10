// 存储角色库
const roleData = {};

// 自动从本地静态 JSON 文件加载角色数据
function fetchLocalJSONs() {
  const files = ['data.json', 'custom.json', 'roletable.json'];
  files.forEach(file => {
    fetch(file)
      .then(res => res.json())
      .then(json => {
        json.forEach(entry => {
          if (entry.name) roleData[entry.name] = entry;
        });
        console.log(`已加载本地 ${file}`);
        updateRoleSuggestions();
      })
      .catch(err => console.error(`加载 ${file} 失败:`, err));
  });
}

// 添加额外状态输入行
function addStateRow() {
  const container = document.getElementById('stateContainer');
  const row = document.createElement('div');
  row.innerHTML = '<input placeholder="状态名" class="stateName"> <input placeholder="描述" class="stateDesc">';
  container.appendChild(row);
}

// 更新 datalist 自动补全
function updateRoleSuggestions() {
  const datalist = document.getElementById("roleSuggestions");
  if (!datalist) return;
  datalist.innerHTML = Object.keys(roleData).sort().map(name => `<option value="${name}">`).join("");
}

// 生成剧本 JSON 并提供下载
function generateScript() {
  const title = document.getElementById('title').value;
  const author = document.getElementById('author').value;
  const logo = document.getElementById('logo').value || "https://www.helloimg.com/i/2024/07/18/669889e8484e6.png";
  const inputRoles = document.getElementById('roles').value.trim().split(/\s+/).concat(["往生者"]);

  const meta = {
    id: "_meta",
    name: title,
    author: author,
    logo: logo,
    townsfolkName: "镇民",
    outsidersName: "外来者",
    minionsName: "爪牙",
    demonsName: "恶魔",
    townsfolk: "镇民",
    outsider: "外来者",
    minion: "爪牙",
    demon: "恶魔",
    "a jinxedName": "相克",
    "a jinxed": "相克"
  };

  if (document.getElementById('addStates').checked) {
    const states = [...document.querySelectorAll('.stateName')].map((_, i) => {
      return {
        stateName: document.querySelectorAll('.stateName')[i].value,
        stateDescription: document.querySelectorAll('.stateDesc')[i].value
      };
    }).filter(s => s.stateName && s.stateDescription);
    if (states.length) meta.state = states;
  }

  const filtered = [];
  const notFound = [];
  const set = new Set();

  inputRoles.forEach(name => {
    if (roleData[name]) {
      if (!set.has(name)) {
        filtered.push(roleData[name]);
        set.add(name);
      }
    } else {
      notFound.push(name);
    }
  });

  for (let i = 0; i < inputRoles.length; i++) {
    for (let j = i + 1; j < inputRoles.length; j++) {
      const n1 = inputRoles[i], n2 = inputRoles[j];
      const combo1 = `${n1}&${n2}`;
      const combo2 = `${n2}&${n1}`;
      if (roleData[combo1] && !set.has(combo1)) {
        filtered.push(roleData[combo1]);
        set.add(combo1);
      } else if (roleData[combo2] && !set.has(combo2)) {
        filtered.push(roleData[combo2]);
        set.add(combo2);
      }
    }
  }

  const finalData = [meta, ...filtered];
  if (notFound.length > 0) alert("未找到的角色：\n" + notFound.join(", "));

  const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.getElementById('downloadLink');
  link.href = url;
  link.download = title + ".json";
  link.style.display = 'inline-block';
  link.textContent = `点击下载：${title}.json`;
}

// 处理上传的 JSON 文件并填入页面字段
function handleJsonImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const json = JSON.parse(evt.target.result);

      // 检查是否是国染委 ID 列表格式（每项只有 id）
      if (Array.isArray(json) && json.every(x => typeof x === 'object' && Object.keys(x).length === 1 && x.id)) {
        const ids = json.map(x => x.id.replace(/[-_]/g, '').toLowerCase());
        const matched = Object.values(roleData).filter(entry => {
          const norm = (entry.id || '').replace(/[-_]/g, '').toLowerCase();
          return ids.includes(norm);
        });

        if (matched.length === 0) {
          alert("未能从 roletable.json 中匹配任何角色");
          return;
        }

        const blob = new Blob([JSON.stringify(matched, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.getElementById('downloadLink');
        link.href = url;
        link.download = "converted.json";
        link.style.display = 'inline-block';
        link.textContent = "点击下载转换后的 JSON 文件";
        alert(`国染委格式已转换，匹配到 ${matched.length} 个角色`);
        return;
      }

      // 否则当作完整剧本导入处理
      const meta = json.find(x => x.id === '_meta');
      const others = json.filter(x => x.id !== '_meta');

      if (meta) {
        document.getElementById('title').value = meta.name || '';
        document.getElementById('author').value = meta.author || '';
        document.getElementById('logo').value = meta.logo || '';
        if (meta.state) {
          meta.state.forEach(state => {
            addStateRow();
            const lastRow = document.querySelectorAll('#stateContainer div:last-child input');
            lastRow[0].value = state.stateName;
            lastRow[1].value = state.stateDescription;
          });
          document.getElementById('addStates').checked = true;
        }
      }

      document.getElementById('roles').value = others.map(x => x.name).join(' ');
      alert('JSON 剧本已载入页面');
    } catch (err) {
      alert('解析 JSON 失败：' + err);
    }
  };
  reader.readAsText(file);
}
}
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('importJson').addEventListener('change', handleJsonImport);
  fetchLocalJSONs();

  const input = document.getElementById("roleInput");
  const textarea = document.getElementById("roles");
  input.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const name = input.value.trim();
      if (name) {
        const current = textarea.value.trim();
        const parts = current ? current.split(/\s+/) : [];
        if (!parts.includes(name)) {
          textarea.value = (current ? current + ' ' : '') + name;
        }
        input.value = '';
      }
    }
  });
});


window.addEventListener('DOMContentLoaded', fetchLocalJSONs);