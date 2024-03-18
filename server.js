const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
var path = require("path");
const session = require("express-session");
const axios = require("axios"); // 导入 axios 模块

// 初始化Express应用程序
const app = express();

// 使用 session 中间件
app.use(
  session({
    secret: "20001215",
    resave: false,
    saveUninitialized: false,
  })
);

// 设置body-parser中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname + "/public")));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "956282",
  database: "webproject",
});
//默认页面
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
//注册页面
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/register.html");
});
//首页页面
app.get("/home", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
//添加游戏页面
app.get("/add", (req, res) => {
  res.sendFile(__dirname + "/add.html");
});

//登录验证
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // 在数据库中查询是否存在相同用户名的账户
  connection.query(
    "SELECT * FROM login WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 如果存在相同用户名的账户，则尝试登录
      if (results.length > 0) {
        // 在实际应用中，应该使用安全的方法来验证密码
        if (results[0].password === password) {
          // res.status(200).send("Login successful!");
          req.session.user_id = results[0].user_id;
          res.redirect("/home");
        } else {
          res.send("Invalid username or password!");
        }
      } else {
      }
    }
  );
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // 检查用户名是否已经存在
  connection.query(
    "SELECT * FROM login WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }
      // 如果用户名已经存在，则返回错误消息
      if (results.length > 0) {
        let userExists = false;
        for (let i = 0; i < results.length; i++) {
          if (results[i].username === username) {
            userExists = true;
            if (results[i].password === password) {
              res.send("Username already exists!"); // 发送用户名已存在的错误消息
            } else {
              res.send("Username already exists! But Wrong Password"); // 发送用户名已存在的错误消息
            }
            break;
          }
        }
        if (!userExists) {
          // 如果用户名不存在，则创建新用户并返回成功消息
          connection.query(
            "INSERT INTO login (username, password) VALUES (?, ?)",
            [username, password],
            (err, results) => {
              if (err) {
                console.error("Error inserting into database: " + err.stack);
                res.status(500).send("Internal Server Error");
                return;
              }
              res.redirect("/index");
            }
          );
        }
      } else {
        // 如果用户名不存在，则创建新用户并返回成功消息
        connection.query(
          "INSERT INTO login (username, password) VALUES (?, ?)",
          [username, password],
          (err, results) => {
            if (err) {
              console.error("Error inserting into database: " + err.stack);
              res.status(500).send("Internal Server Error");
              return;
            }
            res.send("User registered successfully!"); // 发送注册成功的消息
          }
        );
      }
    }
  );
});

app.post("/addgoods", (req, res) => {
  const {
    product_name,
    category_id,
    product_description,
    product_price,
    product_images,
    product_price_promotion,
  } = req.body;

  // 假设用户已经登录，并且登录信息中包含了 user_id
  const user_id = req.session.user_id; // 这里假设通过 req.user 获取到了用户的登录信息
  // 查询登录表获取用户的user_id

  // 执行数据库插入操作
  connection.query(
    "INSERT INTO products (user_id, category_id, product_name, product_description, product_images,product_price, product_price_promotion) VALUES (?, ?, ?, ?, ?, ?,?)",
    [
      user_id,
      category_id,
      product_name,
      product_description,
      product_images,
      product_price,
      product_price_promotion,
    ],
    (err, results) => {
      console.log(results);
      if (err) {
        console.error("Error inserting into database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }
      console.log("Insertion results:", results); // 输出插入结果
      // 根据插入结果发送不同的消息
      if (results.affectedRows > 0) {
        // 如果受影响的行数大于0，则插入成功
        res.send(
          "<script>window.alert('添加成功'); window.location='/add';</script>"
        ); // 发送JavaScript弹窗显示"添加成功"并执行前端重定向
      } else {
        // 否则，插入失败
        res.send("<script>window.alert('添加失败');</script>"); // 发送JavaScript弹窗显示"添加失败"
      }

      // res.send("Product inserted successfully!"); // 发送插入成功的消息
    }
  );
});

app.get("/user/category", (req, res) => {
  // 获取用户ID，假设它存储在 session 中的 user_id 中
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中

  if (!user_id) {
    // 如果用户未登录，则发送一个错误响应
    res.status(401).send("Please login to view products.");
    return;
  }

  // 在数据库中查询用户的产品类别和类别名称
  connection.query(
    "SELECT category_id FROM products WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.length === 0) {
        // 如果未找到与用户关联的产品类别，则发送一个错误响应
        res.status(404).send("Category ID not found for this user.");
        return;
      }

      const categories = results.map((result) => result.category_id); // 提取类别 ID 数组

      // 发送与用户关联的产品类别给客户端
      res.json({ categories: categories }); // 返回包含类别数组的 JSON 对象
    }
  );
});

// 获取所有游戏信息

app.get("/products", (req, res) => {
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中

  // 执行查询以检索特定用户的产品信息
  connection.query(
    "SELECT user_id, category_id, product_name, product_description, product_images, product_price, product_price_promotion FROM products WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.stack);
        res.status(500).send("Internal Server Error");
        return;
      }

      // 将查询结果中的 BLOB 图像数据转换为 Base64 格式
      results.forEach(function (product) {
        if (product.product_images_base64) {
          product.product_images_base64 =
            product.product_images_base64.toString("base64");
        }
      });
        console.log(results);
      // 将查询结果发送给前端
      console.log(results);
      res.json(results);
    }
  );
});

// app.get('/games', (req, res) => {
//   var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中
//   // 在数据库中查询用户的产品类别和类别名称
//   connection.query('SELECT category_id FROM products WHERE user_id = ?', [user_id], (err, results) => {
//     if (err) {
//       console.error('Error querying database: ' + err.stack);
//       res.status(500).send('Internal Server Error');
//       return;
//     }

//     if (results.length === 0) {
//       // 如果未找到与用户关联的产品类别，则发送一个错误响应
//       res.status(404).send('Category ID not found for this user.');
//       return;
//     }

//     const categories = results.map(result => result.category_id); // 提取类别 ID 数组

//     // 发送与用户关联的产品类别给客户端
//     res.json({ categories: categories }); // 返回包含类别数组的 JSON 对象
//   });
// });

// //图片展示区域
// // 添加路由来处理 /carousel-images 路径
// app.get('/carousel-images', (req, res) => {
//   // 假设用户已经登录，并且登录信息中包含了 user_id
//   const user_id = req.session.user_id; // 这里假设通过 req.user 获取到了用户的登录信息

//   if (!user_id) {
//     // 如果用户未登录，则发送一个错误响应
//     res.status(401).send('Please login to view carousel images.');
//     return;
//   }

//   // 在数据库中查询用户的产品图像
//   connection.query('SELECT product_images FROM products WHERE user_id = ?', [user_id], (err, results) => {
//     if (err) {
//       console.error('Error querying database: ' + err.stack);
//       res.status(500).send('Internal Server Error');
//       return;
//     }

//     if (results.length === 0) {
//       // 如果未找到与用户关联的产品图像，则发送一个错误响应
//       res.status(404).send('Product images not found for this user.');
//       return;
//     }

//     console.log(results);
//        // 处理多张图片的情况
//        const images = [];
//        results.forEach(result => {
//          // 转换 BLOB 数据为 Base64 编码的字符串
//          const base64Data = Buffer.from(result.product_images).toString('base64');
//          images.push({ product_image: `data:image/jpeg;base64,${base64Data}` });
//        });

//        res.json(images);

//   });
// });

// 连接到MySQL
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);
});

// 监听端口
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
