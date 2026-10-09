export type QuestionType = "single_choice" | "multiple_choice" | "short_answer";

export interface QuestionOption {
  id: string; // "a" | "b" | "c" | "d"
  text: string;
}

export interface MasterQuestion {
  id: string;
  round_slug: string;
  type: QuestionType;
  title: string;
  description: string;
  code_snippet?: string;
  options: QuestionOption[];
  correct_answer: string; // STRICTLY kept on server - NEVER sent to client
  points: number;
}

export interface ClientQuestion {
  id: string;
  round_slug: string;
  type: QuestionType;
  title: string;
  description: string;
  code_snippet?: string;
  options: QuestionOption[];
  points: number;
}

export const ROUND_1_DURATION_MINUTES = 45; // 45 minutes for assessment arena
export const MAX_STRIKES_ALLOWED = 2; // 1st strike is a 5s grace warning, 2nd strike is instant auto-submit

// Official Schedule: 13th October 2026, 7:00 PM to 8:00 PM IST (UTC+05:30)
export const ROUND_1_START_TIME = "2026-10-13T19:00:00+05:30";
export const ROUND_1_END_TIME = "2026-10-13T20:00:00+05:30";

export function isRound1Active(isPresident = false): {
  active: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  startsAt: string;
  endsAt: string;
} {
  const now = Date.now();
  const start = new Date(ROUND_1_START_TIME).getTime();
  const end = new Date(ROUND_1_END_TIME).getTime();
  const hasStarted = now >= start;
  const hasEnded = now > end;
  const active = isPresident ? true : hasStarted && !hasEnded;
  return {
    active,
    hasStarted,
    hasEnded,
    startsAt: ROUND_1_START_TIME,
    endsAt: ROUND_1_END_TIME,
  };
}

export const MASTER_QUESTIONS: MasterQuestion[] = [
  {
    id: "q1",
    round_slug: "round-1",
    type: "single_choice",
    title: "Array Access Complexity",
    description:
      "What is the time complexity of accessing an element by index in an array?",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(n)" },
      { id: "c", text: "O(log n)" },
      { id: "d", text: "O(n log n)" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q2",
    round_slug: "round-1",
    type: "single_choice",
    title: "Array Index Calculation Output",
    description: "What is the output of the following C++ code?",
    code_snippet: `int a[] = {2, 4, 6, 8};
cout << a[1] + a[3];`,
    options: [
      { id: "a", text: "10" },
      { id: "b", text: "12" },
      { id: "c", text: "14" },
      { id: "d", text: "16" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q3",
    round_slug: "round-1",
    type: "single_choice",
    title: "LIFO Principle",
    description: "Which data structure follows the LIFO principle?",
    options: [
      { id: "a", text: "Queue" },
      { id: "b", text: "Stack" },
      { id: "c", text: "Linked List" },
      { id: "d", text: "Tree" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q4",
    round_slug: "round-1",
    type: "single_choice",
    title: "Stack Sequence Operations",
    description:
      "A stack is initially empty. The operations push(5), push(9), pop(), push(2) are performed. What is now at the top?",
    options: [
      { id: "a", text: "5" },
      { id: "b", text: "9" },
      { id: "c", text: "2" },
      { id: "d", text: "Stack is empty" },
    ],
    correct_answer: "c",
    points: 1,
  },
  {
    id: "q5",
    round_slug: "round-1",
    type: "single_choice",
    title: "Queue Operation Sequence",
    description: "Which sequence of operations is correct for a normal queue?",
    options: [
      { id: "a", text: "Insert at rear, remove from front" },
      { id: "b", text: "Insert at front, remove from rear" },
      { id: "c", text: "Insert and remove only from top" },
      { id: "d", text: "Insert at middle, remove from rear" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q6",
    round_slug: "round-1",
    type: "single_choice",
    title: "Linked List Head Insertion",
    description:
      "What is the time complexity of inserting a new node at the head of a singly linked list?",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n)" },
      { id: "d", text: "O(n^2)" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q7",
    round_slug: "round-1",
    type: "single_choice",
    title: "Singly Linked List Termination",
    description:
      "In a singly linked list, which pointer of the last node normally indicates the end of the list?",
    options: [
      { id: "a", text: "head" },
      { id: "b", text: "prev" },
      { id: "c", text: "next = NULL" },
      { id: "d", text: "next = head" },
    ],
    correct_answer: "c",
    points: 1,
  },
  {
    id: "q8",
    round_slug: "round-1",
    type: "single_choice",
    title: "Binary Search Pre-condition",
    description: "Binary Search can be directly applied when the array is:",
    options: [
      { id: "a", text: "Randomly arranged" },
      { id: "b", text: "Sorted" },
      { id: "c", text: "Only contains unique values" },
      { id: "d", text: "Only contains positive values" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q9",
    round_slug: "round-1",
    type: "single_choice",
    title: "Binary Search Time Complexity",
    description:
      "What is the time complexity of Binary Search on a sorted array of n elements?",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n)" },
      { id: "d", text: "O(n log n)" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q10",
    round_slug: "round-1",
    type: "single_choice",
    title: "Array Filtering Loop Output",
    description: "What will this code print?",
    code_snippet: `int a[] = {1, 3, 5, 7, 9};
int count = 0;
for (int x : a)
    if (x > 4) count++;
cout << count;`,
    options: [
      { id: "a", text: "2" },
      { id: "b", text: "3" },
      { id: "c", text: "4" },
      { id: "d", text: "5" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q11",
    round_slug: "round-1",
    type: "single_choice",
    title: "Sorting Algorithm Stability",
    description:
      "Which of the following sorting algorithms is stable in its standard form?",
    options: [
      { id: "a", text: "Quick Sort" },
      { id: "b", text: "Heap Sort" },
      { id: "c", text: "Merge Sort" },
      { id: "d", text: "Selection Sort" },
    ],
    correct_answer: "c",
    points: 1,
  },
  {
    id: "q12",
    round_slug: "round-1",
    type: "single_choice",
    title: "Bubble Sort First Pass State",
    description:
      "After one complete left-to-right pass of Bubble Sort on [5, 1, 4, 2], what is the array?",
    options: [
      { id: "a", text: "[1, 4, 2, 5]" },
      { id: "b", text: "[1, 2, 4, 5]" },
      { id: "c", text: "[5, 1, 2, 4]" },
      { id: "d", text: "[4, 1, 2, 5]" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q13",
    round_slug: "round-1",
    type: "single_choice",
    title: "Nearly Sorted Array Sorting",
    description:
      "Which sorting algorithm is often a good simple choice for a small, nearly sorted array?",
    options: [
      { id: "a", text: "Insertion Sort" },
      { id: "b", text: "Selection Sort" },
      { id: "c", text: "Heap Sort" },
      { id: "d", text: "Counting Sort" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q14",
    round_slug: "round-1",
    type: "single_choice",
    title: "Selection Sort Outer Pass Behavior",
    description: "In Selection Sort, what happens in each outer pass?",
    options: [
      {
        id: "a",
        text: "The minimum element of the unsorted part is selected and placed correctly",
      },
      {
        id: "b",
        text: "Adjacent elements are repeatedly swapped until no swap occurs",
      },
      { id: "c", text: "The array is divided into halves recursively" },
      { id: "d", text: "A pivot is always placed at index 0" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q15",
    round_slug: "round-1",
    type: "single_choice",
    title: "Recursive Function Call Tracing",
    description: "What is the output of this recursive function call f(3)?",
    code_snippet: `void f(int n) {
    if (n == 0) return;
    cout << n << " ";
    f(n - 1);
}`,
    options: [
      { id: "a", text: "1 2 3" },
      { id: "b", text: "3 2 1" },
      { id: "c", text: "3 3 3" },
      { id: "d", text: "0 1 2 3" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q16",
    round_slug: "round-1",
    type: "single_choice",
    title: "Recursive Factorial Base Case",
    description:
      "Which condition is the correct base case for a recursive factorial function?",
    options: [
      { id: "a", text: "if (n <= 1) return 1;" },
      { id: "b", text: "if (n > 1) return 1;" },
      { id: "c", text: "if (n == 2) return 0;" },
      { id: "d", text: "No base case is required" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q17",
    round_slug: "round-1",
    type: "single_choice",
    title: "Nested Loops Complexity",
    description: "What is the time complexity of the following nested loops?",
    code_snippet: `for (int i = 0; i < n; i++)
    for (int j = 1; j < n; j *= 2)
        cout << i + j;`,
    options: [
      { id: "a", text: "O(n)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n log n)" },
      { id: "d", text: "O(n^2)" },
    ],
    correct_answer: "c",
    points: 1,
  },
  {
    id: "q18",
    round_slug: "round-1",
    type: "single_choice",
    title: "BST Sorted Traversal",
    description:
      "Which traversal of a Binary Search Tree visits its keys in sorted order?",
    options: [
      { id: "a", text: "Preorder" },
      { id: "b", text: "Inorder" },
      { id: "c", text: "Postorder" },
      { id: "d", text: "Level order" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q19",
    round_slug: "round-1",
    type: "single_choice",
    title: "BST Node Insertion",
    description:
      "Insert 10, 5, 15, 12 into an empty Binary Search Tree in that order. Which node becomes the left child of 15?",
    options: [
      { id: "a", text: "5" },
      { id: "b", text: "10" },
      { id: "c", text: "12" },
      { id: "d", text: "15 has no left child" },
    ],
    correct_answer: "c",
    points: 1,
  },
  {
    id: "q20",
    round_slug: "round-1",
    type: "single_choice",
    title: "Filled Binary Tree Height",
    description:
      "A binary tree has 7 nodes and every level is completely filled. What is its height if the root is at height 0?",
    options: [
      { id: "a", text: "1" },
      { id: "b", text: "2" },
      { id: "c", text: "3" },
      { id: "d", text: "7" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q21",
    round_slug: "round-1",
    type: "single_choice",
    title: "BFS Implementation Structure",
    description:
      "Which data structure is normally used to implement Breadth-First Search (BFS)?",
    options: [
      { id: "a", text: "Stack" },
      { id: "b", text: "Queue" },
      { id: "c", text: "Min-Heap" },
      { id: "d", text: "Hash Table" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q22",
    round_slug: "round-1",
    type: "single_choice",
    title: "Depth-First Search Characteristics",
    description: "Which statement about Depth-First Search (DFS) is correct?",
    options: [
      { id: "a", text: "It can be implemented using a stack or recursion" },
      { id: "b", text: "It always finds the shortest weighted path" },
      { id: "c", text: "It requires a priority queue" },
      { id: "d", text: "It only works on trees" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q23",
    round_slug: "round-1",
    type: "single_choice",
    title: "Tree Edge Count",
    description: "How many edges are present in a tree containing 12 nodes?",
    options: [
      { id: "a", text: "10" },
      { id: "b", text: "11" },
      { id: "c", text: "12" },
      { id: "d", text: "13" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q24",
    round_slug: "round-1",
    type: "single_choice",
    title: "Hash Table Search Complexity",
    description:
      "What is the average-case time complexity of searching for a key in a well-designed hash table?",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n)" },
      { id: "d", text: "O(n log n)" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q25",
    round_slug: "round-1",
    type: "single_choice",
    title: "Hash Collision Resolution",
    description:
      "Which of the following is a standard way to handle collisions in a hash table?",
    options: [
      { id: "a", text: "Separate chaining" },
      { id: "b", text: "Binary traversal" },
      { id: "c", text: "Stack unwinding" },
      { id: "d", text: "Tree rotation only" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q26",
    round_slug: "round-1",
    type: "single_choice",
    title: "Min-Heap Root Property",
    description:
      "In a Min-Heap, which element is guaranteed to be at the root?",
    options: [
      { id: "a", text: "Largest element" },
      { id: "b", text: "Smallest element" },
      { id: "c", text: "Most recently inserted element" },
      { id: "d", text: "Median element" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q27",
    round_slug: "round-1",
    type: "single_choice",
    title: "Min-Heap Insertion Complexity",
    description:
      "What is the time complexity of inserting one element into a binary Min-Heap?",
    options: [
      { id: "a", text: "O(1)" },
      { id: "b", text: "O(log n)" },
      { id: "c", text: "O(n)" },
      { id: "d", text: "O(n log n)" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q28",
    round_slug: "round-1",
    type: "single_choice",
    title: "Bracket Balance Data Structure",
    description:
      "Which data structure is most suitable for checking whether brackets in an expression are balanced?",
    options: [
      { id: "a", text: "Queue" },
      { id: "b", text: "Stack" },
      { id: "c", text: "Heap" },
      { id: "d", text: "Graph" },
    ],
    correct_answer: "b",
    points: 1,
  },
  {
    id: "q29",
    round_slug: "round-1",
    type: "single_choice",
    title: "LRU Cache Data Structures",
    description:
      "Which combination is typically used to support O(1) average get and update operations in an LRU Cache?",
    options: [
      { id: "a", text: "Hash Map + Doubly Linked List" },
      { id: "b", text: "Stack + Queue" },
      { id: "c", text: "Binary Tree + Array" },
      { id: "d", text: "Heap + Singly Linked List" },
    ],
    correct_answer: "a",
    points: 1,
  },
  {
    id: "q30",
    round_slug: "round-1",
    type: "single_choice",
    title: "Array Traversal Bounds Fix",
    description:
      "The following loop is intended to print every element of an array of size n safely. Which condition correctly fixes it?",
    code_snippet: `for (int i = 0; i <= n; i++)
    cout << a[i];`,
    options: [
      { id: "a", text: "Change i <= n to i < n" },
      { id: "b", text: "Change i++ to i += 2" },
      { id: "c", text: "Start i from 1" },
      { id: "d", text: "Change a[i] to a[n]" },
    ],
    correct_answer: "a",
    points: 1,
  },
];

/**
 * CRITICAL SECURITY FUNCTION:
 * Strips correct answers completely.
 * The client bundle and network response NEVER contain correct_answer or scoring keys.
 */
export function sanitizeQuestion(q: MasterQuestion): ClientQuestion {
  return {
    id: q.id,
    round_slug: q.round_slug,
    type: q.type,
    title: q.title,
    description: q.description,
    code_snippet: q.code_snippet,
    options: q.options,
    points: q.points,
  };
}

/**
 * Shuffles an array deterministically or randomly.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Grades user responses securely ONLY on the server.
 */
export function gradeSubmission(responses: Record<string, any>): {
  score: number;
  maxScore: number;
  details: Record<string, { isCorrect: boolean; pointsEarned: number }>;
} {
  let score = 0;
  let maxScore = 0;
  const details: Record<string, { isCorrect: boolean; pointsEarned: number }> =
    {};

  for (const q of MASTER_QUESTIONS) {
    maxScore += q.points;
    const userVal = responses[q.id];
    let isCorrect = false;

    if (typeof userVal === "string") {
      isCorrect =
        userVal.toLowerCase().trim() ===
        String(q.correct_answer).toLowerCase().trim();
    }

    const pointsEarned = isCorrect ? q.points : 0;
    score += pointsEarned;
    details[q.id] = { isCorrect, pointsEarned };
  }

  return { score, maxScore, details };
}
