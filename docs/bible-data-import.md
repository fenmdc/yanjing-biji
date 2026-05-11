# 圣经数据导入说明

## 推荐结论

不要优先用 PDF 导入圣经正文。PDF 适合阅读，不适合作为数据库来源，因为经卷、章节、节号很容易在抽取时错位。

第一版最推荐使用 JSON，其次是 CSV / TSV。后续如果拿到 USFM / OSIS / XML，也可以再加转换器。

## 文件放置位置

把待导入的圣经文件放在：

```text
data/bibles/inbox/
```

示例文件在：

```text
data/bibles/examples/cuvs-john-3.sample.json
```

处理完成后，规范化文件可以放在：

```text
data/bibles/processed/
```

## 推荐 JSON 格式

```json
{
  "translation": {
    "code": "CUVS",
    "name": "中文和合本简体",
    "language": "zh-CN",
    "source": "数据来源名称或网址",
    "license": "版权或授权说明"
  },
  "verses": [
    {
      "book": "John",
      "bookZh": "约翰福音",
      "chapter": 3,
      "verse": 16,
      "text": "神爱世人，甚至将他的独生子赐给他们..."
    }
  ]
}
```

## 校验格式

```bash
npm run bible:validate -- data/bibles/inbox/your-bible.json
```

## 关于版本和版权

可以先导入公开授权或公版译本，例如：

- 中文和合本 CUV / CUVS：正式导入前仍建议记录来源和授权说明。
- World English Bible, WEB：适合英文公开版本。
- King James Version, KJV：适合作为英文基础版本。

不建议直接从网页复制现代译本，例如和合本修订版、新译本、当代译本等，除非确认授权允许存储、展示和搜索。

## PDF 怎么办

如果你手上只有 PDF：

1. 先确认版权允许。
2. 尽量转换成每节一行的 CSV / JSON。
3. 不要直接把 PDF 当圣经正文导入数据库。

一个可接受的中间格式：

```csv
translation,book,bookZh,chapter,verse,text
CUVS,John,约翰福音,3,16,神爱世人...
```

后续可以补一个 CSV 转 JSON 的脚本。
