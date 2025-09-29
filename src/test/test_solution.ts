
function solution(intervals) {
  const result = <any>[];
  let a = intervals[0];
  let i = 1;
  while (i<intervals.length) {
      const b = intervals[i];
      if (checkOverlap(a, b)) {
          a = makeOverlap(a, b);
          i++;
      } else {
          result.push(a);
          a = intervals[i++];
      }
  }
  result.push(a);
  return result;
}

function checkOverlap(a, b) {
  if (a[0] < b[0] && a[1] < b[0])
    return false;
  if (b[0] < a[0] && b[1] < a[0])
    return false;
  return true;
}

function makeOverlap(a, b) {
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

exports.solution = solution;
