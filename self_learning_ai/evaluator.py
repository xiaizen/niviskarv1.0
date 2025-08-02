def evaluate_summary(summary):
    score = 0
    if len(summary.split()) >= 20:
        score += 1
    if '.' in summary:
        score += 1
    if any(word in summary.lower() for word in ['conclude', 'result', 'impact']):
        score += 1
    return score
