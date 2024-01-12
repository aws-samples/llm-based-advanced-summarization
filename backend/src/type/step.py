class Step:

  def __init__(self, action: str, input: str, results: str): 
    self.action = action
    self.input = input
    self.results = results

  def to_dict(self):
    return {
      'action': self.action,
      'input': self.input,
      'results': self.results
    }