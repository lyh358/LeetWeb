// LeetCode 热题 100（top-100-liked）数据
// 分类顺序与 https://leetcode.cn/studyplan/top-100-liked/ 保持一致
// difficulty: 1=简单 2=中等 3=困难

const CATEGORIES = [
  "哈希", "双指针", "滑动窗口", "子串", "普通数组", "矩阵", "链表",
  "二叉树", "图论", "回溯", "二分查找", "栈", "堆", "贪心算法",
  "动态规划", "多维动态规划", "技巧"
];

const PROBLEMS = [
  // 哈希
  { id: 1,   title: "两数之和",                              slug: "two-sum",                                                    diff: 1, cat: "哈希" },
  { id: 49,  title: "字母异位词分组",                        slug: "group-anagrams",                                             diff: 2, cat: "哈希" },
  { id: 128, title: "最长连续序列",                          slug: "longest-consecutive-sequence",                               diff: 2, cat: "哈希" },
  // 双指针
  { id: 283, title: "移动零",                                slug: "move-zeroes",                                                diff: 1, cat: "双指针" },
  { id: 11,  title: "盛最多水的容器",                        slug: "container-with-most-water",                                  diff: 2, cat: "双指针" },
  { id: 15,  title: "三数之和",                              slug: "3sum",                                                       diff: 2, cat: "双指针" },
  { id: 42,  title: "接雨水",                                slug: "trapping-rain-water",                                        diff: 3, cat: "双指针" },
  // 滑动窗口
  { id: 3,   title: "无重复字符的最长子串",                  slug: "longest-substring-without-repeating-characters",             diff: 2, cat: "滑动窗口" },
  { id: 438, title: "找到字符串中所有字母异位词",            slug: "find-all-anagrams-in-a-string",                              diff: 2, cat: "滑动窗口" },
  // 子串
  { id: 560, title: "和为 K 的子数组",                       slug: "subarray-sum-equals-k",                                      diff: 2, cat: "子串" },
  { id: 239, title: "滑动窗口最大值",                        slug: "sliding-window-maximum",                                     diff: 3, cat: "子串" },
  { id: 76,  title: "最小覆盖子串",                          slug: "minimum-window-substring",                                   diff: 3, cat: "子串" },
  // 普通数组
  { id: 53,  title: "最大子数组和",                          slug: "maximum-subarray",                                           diff: 2, cat: "普通数组" },
  { id: 56,  title: "合并区间",                              slug: "merge-intervals",                                            diff: 2, cat: "普通数组" },
  { id: 189, title: "轮转数组",                              slug: "rotate-array",                                               diff: 2, cat: "普通数组" },
  { id: 238, title: "除自身以外数组的乘积",                  slug: "product-of-array-except-self",                               diff: 2, cat: "普通数组" },
  { id: 41,  title: "缺失的第一个正数",                      slug: "first-missing-positive",                                     diff: 3, cat: "普通数组" },
  // 矩阵
  { id: 73,  title: "矩阵置零",                              slug: "set-matrix-zeroes",                                          diff: 2, cat: "矩阵" },
  { id: 54,  title: "螺旋矩阵",                              slug: "spiral-matrix",                                              diff: 2, cat: "矩阵" },
  { id: 48,  title: "旋转图像",                              slug: "rotate-image",                                               diff: 2, cat: "矩阵" },
  { id: 240, title: "搜索二维矩阵 II",                       slug: "search-a-2d-matrix-ii",                                      diff: 2, cat: "矩阵" },
  // 链表
  { id: 160, title: "相交链表",                              slug: "intersection-of-two-linked-lists",                           diff: 1, cat: "链表" },
  { id: 206, title: "反转链表",                              slug: "reverse-linked-list",                                        diff: 1, cat: "链表" },
  { id: 234, title: "回文链表",                              slug: "palindrome-linked-list",                                     diff: 1, cat: "链表" },
  { id: 141, title: "环形链表",                              slug: "linked-list-cycle",                                          diff: 1, cat: "链表" },
  { id: 142, title: "环形链表 II",                           slug: "linked-list-cycle-ii",                                       diff: 2, cat: "链表" },
  { id: 21,  title: "合并两个有序链表",                      slug: "merge-two-sorted-lists",                                     diff: 1, cat: "链表" },
  { id: 2,   title: "两数相加",                              slug: "add-two-numbers",                                            diff: 2, cat: "链表" },
  { id: 19,  title: "删除链表的倒数第 N 个结点",             slug: "remove-nth-node-from-end-of-list",                           diff: 2, cat: "链表" },
  { id: 24,  title: "两两交换链表中的节点",                  slug: "swap-nodes-in-pairs",                                        diff: 2, cat: "链表" },
  { id: 25,  title: "K 个一组翻转链表",                      slug: "reverse-nodes-in-k-group",                                   diff: 3, cat: "链表" },
  { id: 138, title: "随机链表的复制",                        slug: "copy-list-with-random-pointer",                              diff: 2, cat: "链表" },
  { id: 148, title: "排序链表",                              slug: "sort-list",                                                  diff: 2, cat: "链表" },
  { id: 23,  title: "合并 K 个升序链表",                     slug: "merge-k-sorted-lists",                                       diff: 3, cat: "链表" },
  { id: 146, title: "LRU 缓存",                              slug: "lru-cache",                                                  diff: 2, cat: "链表" },
  // 二叉树
  { id: 94,  title: "二叉树的中序遍历",                      slug: "binary-tree-inorder-traversal",                              diff: 1, cat: "二叉树" },
  { id: 104, title: "二叉树的最大深度",                      slug: "maximum-depth-of-binary-tree",                               diff: 1, cat: "二叉树" },
  { id: 226, title: "翻转二叉树",                            slug: "invert-binary-tree",                                         diff: 1, cat: "二叉树" },
  { id: 101, title: "对称二叉树",                            slug: "symmetric-tree",                                             diff: 1, cat: "二叉树" },
  { id: 543, title: "二叉树的直径",                          slug: "diameter-of-binary-tree",                                    diff: 1, cat: "二叉树" },
  { id: 102, title: "二叉树的层序遍历",                      slug: "binary-tree-level-order-traversal",                          diff: 2, cat: "二叉树" },
  { id: 108, title: "将有序数组转换为二叉搜索树",            slug: "convert-sorted-array-to-binary-search-tree",                 diff: 1, cat: "二叉树" },
  { id: 98,  title: "验证二叉搜索树",                        slug: "validate-binary-search-tree",                                diff: 2, cat: "二叉树" },
  { id: 230, title: "二叉搜索树中第 K 小的元素",             slug: "kth-smallest-element-in-a-bst",                              diff: 2, cat: "二叉树" },
  { id: 199, title: "二叉树的右视图",                        slug: "binary-tree-right-side-view",                                diff: 2, cat: "二叉树" },
  { id: 114, title: "二叉树展开为链表",                      slug: "flatten-binary-tree-to-linked-list",                         diff: 2, cat: "二叉树" },
  { id: 105, title: "从前序与中序遍历序列构造二叉树",        slug: "construct-binary-tree-from-preorder-and-inorder-traversal",  diff: 2, cat: "二叉树" },
  { id: 437, title: "路径总和 III",                          slug: "path-sum-iii",                                               diff: 2, cat: "二叉树" },
  { id: 236, title: "二叉树的最近公共祖先",                  slug: "lowest-common-ancestor-of-a-binary-tree",                    diff: 2, cat: "二叉树" },
  { id: 124, title: "二叉树中的最大路径和",                  slug: "binary-tree-maximum-path-sum",                               diff: 3, cat: "二叉树" },
  // 图论
  { id: 200, title: "岛屿数量",                              slug: "number-of-islands",                                          diff: 2, cat: "图论" },
  { id: 994, title: "腐烂的橘子",                            slug: "rotting-oranges",                                            diff: 2, cat: "图论" },
  { id: 207, title: "课程表",                                slug: "course-schedule",                                            diff: 2, cat: "图论" },
  { id: 208, title: "实现 Trie (前缀树)",                    slug: "implement-trie-prefix-tree",                                 diff: 2, cat: "图论" },
  // 回溯
  { id: 46,  title: "全排列",                                slug: "permutations",                                               diff: 2, cat: "回溯" },
  { id: 78,  title: "子集",                                  slug: "subsets",                                                    diff: 2, cat: "回溯" },
  { id: 17,  title: "电话号码的字母组合",                    slug: "letter-combinations-of-a-phone-number",                      diff: 2, cat: "回溯" },
  { id: 39,  title: "组合总和",                              slug: "combination-sum",                                            diff: 2, cat: "回溯" },
  { id: 22,  title: "括号生成",                              slug: "generate-parentheses",                                       diff: 2, cat: "回溯" },
  { id: 79,  title: "单词搜索",                              slug: "word-search",                                                diff: 2, cat: "回溯" },
  { id: 131, title: "分割回文串",                            slug: "palindrome-partitioning",                                    diff: 2, cat: "回溯" },
  { id: 51,  title: "N 皇后",                                slug: "n-queens",                                                   diff: 3, cat: "回溯" },
  // 二分查找
  { id: 35,  title: "搜索插入位置",                          slug: "search-insert-position",                                     diff: 1, cat: "二分查找" },
  { id: 74,  title: "搜索二维矩阵",                          slug: "search-a-2d-matrix",                                         diff: 2, cat: "二分查找" },
  { id: 34,  title: "在排序数组中查找元素的第一个和最后一个位置", slug: "find-first-and-last-position-of-element-in-sorted-array", diff: 2, cat: "二分查找" },
  { id: 33,  title: "搜索旋转排序数组",                      slug: "search-in-rotated-sorted-array",                             diff: 2, cat: "二分查找" },
  { id: 153, title: "寻找旋转排序数组中的最小值",            slug: "find-minimum-in-rotated-sorted-array",                       diff: 2, cat: "二分查找" },
  { id: 4,   title: "寻找两个正序数组的中位数",              slug: "median-of-two-sorted-arrays",                                diff: 3, cat: "二分查找" },
  // 栈
  { id: 20,  title: "有效的括号",                            slug: "valid-parentheses",                                          diff: 1, cat: "栈" },
  { id: 155, title: "最小栈",                                slug: "min-stack",                                                  diff: 2, cat: "栈" },
  { id: 394, title: "字符串解码",                            slug: "decode-string",                                              diff: 2, cat: "栈" },
  { id: 739, title: "每日温度",                              slug: "daily-temperatures",                                         diff: 2, cat: "栈" },
  { id: 84,  title: "柱状图中最大的矩形",                    slug: "largest-rectangle-in-histogram",                             diff: 3, cat: "栈" },
  // 堆
  { id: 215, title: "数组中的第 K 个最大元素",               slug: "kth-largest-element-in-an-array",                            diff: 2, cat: "堆" },
  { id: 347, title: "前 K 个高频元素",                       slug: "top-k-frequent-elements",                                    diff: 2, cat: "堆" },
  { id: 295, title: "数据流的中位数",                        slug: "find-median-from-data-stream",                               diff: 3, cat: "堆" },
  // 贪心算法
  { id: 121, title: "买卖股票的最佳时机",                    slug: "best-time-to-buy-and-sell-stock",                            diff: 1, cat: "贪心算法" },
  { id: 55,  title: "跳跃游戏",                              slug: "jump-game",                                                  diff: 2, cat: "贪心算法" },
  { id: 45,  title: "跳跃游戏 II",                           slug: "jump-game-ii",                                               diff: 2, cat: "贪心算法" },
  { id: 763, title: "划分字母区间",                          slug: "partition-labels",                                           diff: 2, cat: "贪心算法" },
  // 动态规划
  { id: 70,  title: "爬楼梯",                                slug: "climbing-stairs",                                            diff: 1, cat: "动态规划" },
  { id: 118, title: "杨辉三角",                              slug: "pascals-triangle",                                           diff: 1, cat: "动态规划" },
  { id: 198, title: "打家劫舍",                              slug: "house-robber",                                               diff: 2, cat: "动态规划" },
  { id: 279, title: "完全平方数",                            slug: "perfect-squares",                                            diff: 2, cat: "动态规划" },
  { id: 322, title: "零钱兑换",                              slug: "coin-change",                                                diff: 2, cat: "动态规划" },
  { id: 139, title: "单词拆分",                              slug: "word-break",                                                 diff: 2, cat: "动态规划" },
  { id: 300, title: "最长递增子序列",                        slug: "longest-increasing-subsequence",                             diff: 2, cat: "动态规划" },
  { id: 152, title: "乘积最大子数组",                        slug: "maximum-product-subarray",                                   diff: 2, cat: "动态规划" },
  { id: 416, title: "分割等和子集",                          slug: "partition-equal-subset-sum",                                 diff: 2, cat: "动态规划" },
  { id: 32,  title: "最长有效括号",                          slug: "longest-valid-parentheses",                                  diff: 3, cat: "动态规划" },
  // 多维动态规划
  { id: 62,  title: "不同路径",                              slug: "unique-paths",                                               diff: 2, cat: "多维动态规划" },
  { id: 64,  title: "最小路径和",                            slug: "minimum-path-sum",                                           diff: 2, cat: "多维动态规划" },
  { id: 5,   title: "最长回文子串",                          slug: "longest-palindromic-substring",                              diff: 2, cat: "多维动态规划" },
  { id: 1143,title: "最长公共子序列",                        slug: "longest-common-subsequence",                                 diff: 2, cat: "多维动态规划" },
  { id: 72,  title: "编辑距离",                              slug: "edit-distance",                                              diff: 2, cat: "多维动态规划" },
  // 技巧
  { id: 136, title: "只出现一次的数字",                      slug: "single-number",                                              diff: 1, cat: "技巧" },
  { id: 169, title: "多数元素",                              slug: "majority-element",                                           diff: 1, cat: "技巧" },
  { id: 75,  title: "颜色分类",                              slug: "sort-colors",                                                diff: 2, cat: "技巧" },
  { id: 31,  title: "下一个排列",                            slug: "next-permutation",                                           diff: 2, cat: "技巧" },
  { id: 287, title: "寻找重复数",                            slug: "find-the-duplicate-number",                                  diff: 2, cat: "技巧" },
];

// 经典 Hot 100 题单中、但不在当前官方「热题 100」学习计划里的题目。
// 来源：https://leetcode.cn/problem-list/2cktkvj/（2026-08-11 核对）
const EXTRA_PROBLEMS = [
  { id: 461, title: "汉明距离",                            slug: "hamming-distance",                                           diff: 1, cat: "经典补充" },
  { id: 448, title: "找到所有数组中消失的数字",            slug: "find-all-numbers-disappeared-in-an-array",                   diff: 1, cat: "经典补充" },
  { id: 338, title: "比特位计数",                          slug: "counting-bits",                                              diff: 1, cat: "经典补充" },
  { id: 617, title: "合并二叉树",                          slug: "merge-two-binary-trees",                                    diff: 1, cat: "经典补充" },
  { id: 221, title: "最大正方形",                          slug: "maximal-square",                                             diff: 2, cat: "经典补充" },
  { id: 647, title: "回文子串",                            slug: "palindromic-substrings",                                     diff: 2, cat: "经典补充" },
  { id: 494, title: "目标和",                              slug: "target-sum",                                                 diff: 2, cat: "经典补充" },
  { id: 406, title: "根据身高重建队列",                    slug: "queue-reconstruction-by-height",                            diff: 2, cat: "经典补充" },
  { id: 399, title: "除法求值",                            slug: "evaluate-division",                                          diff: 2, cat: "经典补充" },
  { id: 337, title: "打家劫舍 III",                        slug: "house-robber-iii",                                           diff: 2, cat: "经典补充" },
  { id: 309, title: "买卖股票的最佳时机含冷冻期",          slug: "best-time-to-buy-and-sell-stock-with-cooldown",             diff: 2, cat: "经典补充" },
  { id: 253, title: "会议室 II",                           slug: "meeting-rooms-ii",                                           diff: 2, cat: "经典补充", premium: true },
  { id: 538, title: "把二叉搜索树转换为累加树",            slug: "convert-bst-to-greater-tree",                               diff: 2, cat: "经典补充" },
  { id: 621, title: "任务调度器",                          slug: "task-scheduler",                                              diff: 2, cat: "经典补充" },
  { id: 96,  title: "不同的二叉搜索树",                    slug: "unique-binary-search-trees",                                diff: 2, cat: "经典补充" },
  { id: 581, title: "最短无序连续子数组",                  slug: "shortest-unsorted-continuous-subarray",                     diff: 2, cat: "经典补充" },
  { id: 312, title: "戳气球",                              slug: "burst-balloons",                                             diff: 3, cat: "经典补充" },
  { id: 301, title: "删除无效的括号",                      slug: "remove-invalid-parentheses",                               diff: 3, cat: "经典补充" },
  { id: 297, title: "二叉树的序列化与反序列化",            slug: "serialize-and-deserialize-binary-tree",                     diff: 3, cat: "经典补充" },
  { id: 10,  title: "正则表达式匹配",                      slug: "regular-expression-matching",                              diff: 3, cat: "经典补充" },
  { id: 85,  title: "最大矩形",                            slug: "maximal-rectangle",                                          diff: 3, cat: "经典补充" },
];

const HUAWEI_EXTRA_PROBLEMS = [
  { id: 122, title: "买卖股票的最佳时机 II",                slug: "best-time-to-buy-and-sell-stock-ii",                         diff: 2, cat: "华为高频补充" },
  { id: 1423,title: "可获得的最大点数",                    slug: "maximum-points-you-can-obtain-from-cards",                   diff: 2, cat: "华为高频补充" },
  { id: 134, title: "加油站",                              slug: "gas-station",                                                diff: 2, cat: "华为高频补充" },
  { id: 217, title: "存在重复元素",                        slug: "contains-duplicate",                                         diff: 1, cat: "华为高频补充" },
  { id: 456, title: "132 模式",                            slug: "132-pattern",                                                diff: 2, cat: "华为高频补充" },
  { id: 71,  title: "简化路径",                            slug: "simplify-path",                                              diff: 2, cat: "华为高频补充" },
  { id: 986, title: "区间列表的交集",                      slug: "interval-list-intersections",                                diff: 2, cat: "华为高频补充" },
  { id: 1011,title: "在 D 天内送达包裹的能力",             slug: "capacity-to-ship-packages-within-d-days",                    diff: 2, cat: "华为高频补充" },
  { id: 110, title: "平衡二叉树",                          slug: "balanced-binary-tree",                                       diff: 1, cat: "华为高频补充" },
  { id: 113, title: "路径总和 II",                         slug: "path-sum-ii",                                                diff: 2, cat: "华为高频补充" },
  { id: 129, title: "求根节点到叶节点数字之和",            slug: "sum-root-to-leaf-numbers",                                   diff: 2, cat: "华为高频补充" },
  { id: 1160,title: "拼写单词",                            slug: "find-words-that-can-be-formed-by-characters",                diff: 1, cat: "华为高频补充" },
  { id: 1302,title: "层数最深叶子节点的和",                slug: "deepest-leaves-sum",                                         diff: 2, cat: "华为高频补充" },
  { id: 14,  title: "最长公共前缀",                        slug: "longest-common-prefix",                                      diff: 1, cat: "华为高频补充" },
  { id: 149, title: "直线上最多的点数",                    slug: "max-points-on-a-line",                                       diff: 3, cat: "华为高频补充" },
  { id: 151, title: "反转字符串中的单词",                  slug: "reverse-words-in-a-string",                                  diff: 2, cat: "华为高频补充" },
  { id: 1624,title: "两个相同字符之间的最长子字符串",      slug: "largest-substring-between-two-equal-characters",             diff: 1, cat: "华为高频补充" },
  { id: 179, title: "最大数",                              slug: "largest-number",                                             diff: 2, cat: "华为高频补充" },
  { id: 1790,title: "仅执行一次字符串交换能否使两个字符串相等", slug: "check-if-one-string-swap-can-make-strings-equal",        diff: 1, cat: "华为高频补充" },
  { id: 1905,title: "统计子岛屿",                          slug: "count-sub-islands",                                          diff: 2, cat: "华为高频补充" },
  { id: 1985,title: "找出数组中的第 K 大整数",             slug: "find-the-kth-largest-integer-in-the-array",                   diff: 2, cat: "华为高频补充" },
  { id: 204, title: "计数质数",                            slug: "count-primes",                                               diff: 2, cat: "华为高频补充" },
  { id: 209, title: "长度最小的子数组",                    slug: "minimum-size-subarray-sum",                                  diff: 2, cat: "华为高频补充" },
  { id: 2094,title: "找出 3 位偶数",                       slug: "finding-3-digit-even-numbers",                               diff: 1, cat: "华为高频补充" },
  { id: 223, title: "矩形面积",                            slug: "rectangle-area",                                             diff: 2, cat: "华为高频补充" },
  { id: 2289,title: "使数组按非递减顺序排列",              slug: "steps-to-make-array-non-decreasing",                         diff: 2, cat: "华为高频补充" },
  { id: 263, title: "丑数",                                slug: "ugly-number",                                                diff: 1, cat: "华为高频补充" },
  { id: 316, title: "去除重复字母",                        slug: "remove-duplicate-letters",                                    diff: 2, cat: "华为高频补充" },
  { id: 377, title: "组合总和 IV",                         slug: "combination-sum-iv",                                         diff: 2, cat: "华为高频补充" },
  { id: 415, title: "字符串相加",                          slug: "add-strings",                                                diff: 1, cat: "华为高频补充" },
  { id: 47,  title: "全排列 II",                           slug: "permutations-ii",                                            diff: 2, cat: "华为高频补充" },
  { id: 480, title: "滑动窗口中位数",                      slug: "sliding-window-median",                                      diff: 3, cat: "华为高频补充" },
  { id: 582, title: "杀掉进程",                            slug: "kill-process",                                               diff: 2, cat: "华为高频补充", premium: true },
  { id: 583, title: "两个字符串的删除操作",                slug: "delete-operation-for-two-strings",                           diff: 2, cat: "华为高频补充" },
  { id: 65,  title: "有效数字",                            slug: "valid-number",                                               diff: 3, cat: "华为高频补充" },
  { id: 678, title: "有效的括号字符串",                    slug: "valid-parenthesis-string",                                   diff: 2, cat: "华为高频补充" },
  { id: 679, title: "24 点游戏",                           slug: "24-game",                                                    diff: 3, cat: "华为高频补充" },
  { id: 690, title: "员工的重要性",                        slug: "employee-importance",                                        diff: 2, cat: "华为高频补充" },
  { id: 692, title: "前 K 个高频单词",                     slug: "top-k-frequent-words",                                       diff: 2, cat: "华为高频补充" },
  { id: 704, title: "二分查找",                            slug: "binary-search",                                              diff: 1, cat: "华为高频补充" },
  { id: 708, title: "循环有序列表的插入",                  slug: "insert-into-a-sorted-circular-linked-list",                   diff: 2, cat: "华为高频补充", premium: true },
  { id: 718, title: "最长重复子数组",                      slug: "maximum-length-of-repeated-subarray",                        diff: 2, cat: "华为高频补充" },
  { id: 735, title: "小行星碰撞",                          slug: "asteroid-collision",                                         diff: 2, cat: "华为高频补充" },
  { id: 875, title: "爱吃香蕉的珂珂",                      slug: "koko-eating-bananas",                                        diff: 2, cat: "华为高频补充" },
  { id: 91,  title: "解码方法",                            slug: "decode-ways",                                                diff: 2, cat: "华为高频补充" },
  { id: 951, title: "翻转等价二叉树",                      slug: "flip-equivalent-binary-trees",                               diff: 2, cat: "华为高频补充" },
  { id: "M0106", title: "面试题 01.06. 字符串压缩",        slug: "compress-string-lcci",                                       diff: 1, cat: "华为高频补充" },
  { id: "M0202", title: "面试题 02.02. 返回倒数第 k 个节点", slug: "kth-node-from-end-of-list-lcci",                            diff: 1, cat: "华为高频补充" },
  { id: "M1724", title: "面试题 17.24. 最大子矩阵",        slug: "max-submatrix-lcci",                                         diff: 3, cat: "华为高频补充" },
];

// 华为校招&实习高频刷题排序源。
// 来源页：https://codefun2000.com/codenote/hot100/P0023
// 说明：普通 LeetCode、LCR、面试题都会纳入；无法定位到 LeetCode 原题的原创手撕题暂不进入本轮单。
// rank 越小越靠前，hits 表示从用户提供文本中合并出的出现频次；与官方 Hot100 重合的题会额外加权。
const HUAWEI_HIGH_FREQ_SOURCE_URL = "https://codefun2000.com/codenote/hot100/P0023";
const HUAWEI_HOT100_BONUS = 0.35;
const HUAWEI_HIGH_FREQ_ITEMS = [
  { id: 20, hits: 13 }, { id: 200, hits: 10 }, { id: 739, hits: 7 }, { id: 994, hits: 7 },
  { id: 1, hits: 6 }, { id: 3, hits: 6 }, { id: 46, hits: 6 }, { id: 122, hits: 5 },
  { id: 56, hits: 5 }, { id: 102, hits: 4 }, { id: 1423, hits: 4 }, { id: 394, hits: 4 },
  { id: 64, hits: 4 }, { id: 11, hits: 2 }, { id: 134, hits: 2 }, { id: 141, hits: 2 },
  { id: 15, hits: 2 }, { id: 155, hits: 2 }, { id: 21, hits: 2 }, { id: 217, hits: 2 },
  { id: 23, hits: 2 }, { id: 42, hits: 2 }, { id: 456, hits: 2 }, { id: 49, hits: 2 },
  { id: 5, hits: 2 }, { id: 71, hits: 2 }, { id: 986, hits: 2 }, { id: 1011, hits: 1 },
  { id: 104, hits: 1 }, { id: 110, hits: 1 }, { id: 113, hits: 1 }, { id: 1143, hits: 1 },
  { id: 1160, hits: 1 }, { id: 129, hits: 1 }, { id: 1302, hits: 1 }, { id: 139, hits: 1 }, { id: 14, hits: 1 },
  { id: 146, hits: 1 }, { id: 149, hits: 1 }, { id: 151, hits: 1 }, { id: 152, hits: 1 },
  { id: 160, hits: 1 }, { id: 1624, hits: 1 }, { id: 17, hits: 1 }, { id: 179, hits: 1 },
  { id: 1790, hits: 1 }, { id: 19, hits: 1 }, { id: 1905, hits: 1 }, { id: 198, hits: 1 },
  { id: 1985, hits: 1 }, { id: 2, hits: 1 }, { id: 204, hits: 1 }, { id: 209, hits: 1 },
  { id: 2094, hits: 1 }, { id: 215, hits: 1 }, { id: 223, hits: 1 }, { id: 2289, hits: 1 },
  { id: 239, hits: 1 }, { id: 240, hits: 1 }, { id: 263, hits: 1 }, { id: 300, hits: 1 },
  { id: 316, hits: 1 }, { id: 322, hits: 1 }, { id: 377, hits: 1 }, { id: 4, hits: 1 },
  { id: 415, hits: 1 }, { id: 416, hits: 1 }, { id: 47, hits: 1 }, { id: 480, hits: 1 },
  { id: 53, hits: 1 }, { id: 54, hits: 1 }, { id: 582, hits: 1 }, { id: 583, hits: 1 },
  { id: 62, hits: 1 }, { id: 647, hits: 1 }, { id: 65, hits: 1 }, { id: 678, hits: 1 },
  { id: 679, hits: 1 }, { id: 690, hits: 1 }, { id: 692, hits: 1 }, { id: 70, hits: 1 },
  { id: 704, hits: 1 }, { id: 708, hits: 1 }, { id: 718, hits: 1 }, { id: 72, hits: 1 },
  { id: 735, hits: 1 }, { id: 74, hits: 1 }, { id: 875, hits: 1 }, { id: 91, hits: 1 },
  { id: 951, hits: 1 }, { id: "M0106", hits: 1 }, { id: "M0202", hits: 1 }, { id: "M1724", hits: 1 },
];

const DIFF_TEXT = { 1: "简单", 2: "中等", 3: "困难" };

// 便捷索引
const ALL_PROBLEMS = [...PROBLEMS, ...EXTRA_PROBLEMS, ...HUAWEI_EXTRA_PROBLEMS];
const PROBLEM_BY_ID = ALL_PROBLEMS.reduce((m, p) => (m[p.id] = p, m), {});
const HOT100_ID_SET = new Set(PROBLEMS.map(p => p.id));
const HUAWEI_HIGH_FREQ_MAP = HUAWEI_HIGH_FREQ_ITEMS.reduce((m, item, index) => {
  m[item.id] = Object.assign({ rank: index + 1 }, item);
  return m;
}, {});

function getHuaweiHighFreqMeta(id) {
  const item = HUAWEI_HIGH_FREQ_MAP[id];
  if (!item) return null;
  const inHot100 = HOT100_ID_SET.has(Number(id));
  return {
    rank: item.rank,
    hits: item.hits,
    inHot100,
    score: item.hits + (inHot100 ? HUAWEI_HOT100_BONUS : 0),
  };
}

function getHuaweiHighFreqProblems() {
  return HUAWEI_HIGH_FREQ_ITEMS
    .map(item => PROBLEM_BY_ID[item.id])
    .filter(Boolean)
    .sort((a, b) => {
      const ma = getHuaweiHighFreqMeta(a.id);
      const mb = getHuaweiHighFreqMeta(b.id);
      return (mb.score - ma.score) || (ma.rank - mb.rank);
    });
}
