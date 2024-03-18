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

//Cart页面
app.get("/cart", (req, res) => {
  res.sendFile(__dirname + "/cart.html");
});
//添加游戏页面
app.get("/manage", (req, res) => {
  res.sendFile(__dirname + "/manage.html");
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
          res.send( "<script>window.alert('Login Sucessful!'); window.location='/home';</script>");
        } else {
          res.send( "<script>window.alert('Invalid username or password!'); window.location='/';</script>");
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
              res.send( "<script>window.alert('Account already exist! Please go to sign in!'); window.location='/';</script>"); // 发送用户名已存在的错误消息
            } else {
              res.send( "<script>window.alert('Username already exists! But Wrong Password!'); window.location='/';</script>");
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
              res.send( "<script>window.alert('Register Sucessful!'); window.location='/';</script>");
            }
          );
        }
      } else {
        // 如果用户名不存在，则创建新用户并返回成功消息
        // connection.query(
        //   "INSERT INTO login (username, password) VALUES (?, ?)",
        //   [username, password],
        //   (err, results) => {
        //     if (err) {
        //       console.error("Error inserting into database: " + err.stack);
        //       res.status(500).send("Internal Server Error");
        //       return;
        //     }
        //     res.send("User registered successfully!"); // 发送注册成功的消息
        //   }
        // );
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


// 获取首页推送
app.get("/products", (req, res) => {
  var user_id = req.session.user_id; // 假设用户ID存储在 session 中的 user_id 变量中

  // 执行查询以检索特定用户的产品信息
  connection.query(
    "SELECT p.user_id, p.product_id, p.category_id, p.product_name, p.product_description, p.product_images, p.product_price, p.product_price_promotion, s.product_sales_count FROM products p LEFT JOIN sales s ON p.product_id = s.product_id WHERE p.user_id = ? ORDER BY RAND() LIMIT 4",
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

      // 将查询结果发送给前端
      console.log(results);
      res.json(results);
    }
  );
});

//管理页面所有游戏库
app.get("/management", (req, res) => {
  var user_id = req.session.user_id; 

  // 执行查询以检索特定用户的产品信息
  connection.query(
    "SELECT user_id, product_id, category_id, product_name, product_description, product_images, product_price, product_price_promotion FROM products WHERE user_id = ?",
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
app.post('/purchase', (req, res) => {
  const productId = req.body.productId; // 从请求体中获取产品ID
  const productName = req.body.productName;
  console.log(productId);
  console.log(productName);
  // 尝试插入新记录，如果记录已存在则更新现有记录
  connection.query(
    'INSERT INTO sales(product_id, product_sales_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE product_sales_count = product_sales_count + 1',
    [productId],
    (err, results) => {
      if (err) {
        console.error('Error inserting or updating sales record:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log('Sales record inserted or updated successfully');
      res.json({ success: true }); // 返回成功响应给客户端
    }
  );
});
// app.post('/purchase', (req, res) => {
//   const productId = req.body.productId; // 从请求体中获取产品ID
//   const productName = req.body.productName; // 从请求体中获取产品名称
//   console.log(productName);

//   // 查询sales表中是否存在该产品的记录
//   connection.query(
//     'SELECT * FROM sales WHERE product_id = ?',
//     [productId, productName],
//     (err, results) => {
//       if (err) {
//         console.error('Error checking sales:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//         return;
//       }

//       // 如果结果为空，说明sales表中不存在该产品的记录，则插入一条新记录
//       if (results.length === 0) {
//         connection.query(
//           'INSERT INTO sales(product_id, product_name, product_sales_count) VALUES (?, ?, ?)',
//           [productId, productName, 1], // 插入新记录时，初始销售数量为1
//           (err, results) => {
//             if (err) {
//               console.error('Error inserting new sales record:', err);
//               res.status(500).json({ error: 'Internal Server Error' });
//               return;
//             }
//             console.log('New sales record inserted successfully');
//             res.json({ success: true }); // 返回成功响应给客户端
//           }
//         );
//       } else {
//         // 如果结果不为空，则更新现有记录的销售数量
//         connection.query(
//           'UPDATE sales SET product_sales_count = product_sales_count + 1 WHERE product_id = ?',
//           [productId],
//           (err, results) => {
//             if (err) {
//               console.error('Error updating sales record:', err);
//               res.status(500).json({ error: 'Internal Server Error' });
//               return;
//             }
//             console.log('Sales record updated successfully');
//             res.json({ success: true }); // 返回成功响应给客户端
//           }
//         );
//       }
//     }
//   );
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
