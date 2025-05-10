// 存储加载的角色库数据（按 name 映射）
const roleData = {};

// 读取多个 json 文件（data.json / custom.json / roletable.json）
function loadFiles() {
  const files = document.getElementById('fileInput').files;
  if (!files.length) return alert("请先选择 JSON 文件");

  [...files].forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        json.forEach(entry => {
          if (entry.name) {
            roleData[entry.name] = entry;
          }
        });
        alert(`成功加载 ${file.name}`);
        updateRoleSuggestions();
      } catch (err) {
        alert(`解析 ${file.name} 失败：` + err);
      }
    };
    reader.readAsText(file);
  });
}

// 添加额外状态输入行
function addStateRow() {
  const container = document.getElementById('stateContainer');
  const row = document.createElement('div');
  row.innerHTML = '<input placeholder="状态名" class="stateName"> <input placeholder="描述" class="stateDesc">';
  container.appendChild(row);
}

// 构造最终 JSON 并生成下载
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
    const stateBlocks = [...document.querySelectorAll('.stateName')].map((_, i) => {
      return {
        stateName: document.querySelectorAll('.stateName')[i].value,
        stateDescription: document.querySelectorAll('.stateDesc')[i].value
      };
    }).filter(s => s.stateName && s.stateDescription);
    if (stateBlocks.length) meta.state = stateBlocks;
  }

  // 处理角色和组合
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

  // 生成文件下载
  const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.getElementById('downloadLink');
  link.href = url;
  link.download = title + ".json";
  link.style.display = 'block';
  link.textContent = `点击下载：${title}.json`;
}
